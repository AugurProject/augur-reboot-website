#!/usr/bin/env node

/**
 * Augur Fork Risk Calculator
 *
 * This script calculates the current risk of an Augur fork based on:
 * - Active dispute bonds and their sizes relative to fork threshold
 *
 * Results are saved to public/data/fork-risk.json for the UI to consume.
 * All calculations are transparent and auditable.
 */

import { ethers } from 'ethers'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// TypeScript interfaces
interface DisputeDetails {
	marketId: string
	title: string
	disputeBondSize: number
	disputeRound: number
	daysRemaining: number
}

interface RpcInfo {
	endpoint: string | null
	latency: number | null
	fallbacksAttempted: number
}

interface Metrics {
	largestDisputeBond: number
	forkThresholdPercent: number
	activeDisputes: number
	disputeDetails: DisputeDetails[]
}

interface Calculation {
	method: string
	forkThreshold: number
}

interface ForkRiskData {
	timestamp: string
	blockNumber?: number
	riskLevel: 'low' | 'moderate' | 'high' | 'critical' | 'unknown'
	riskPercentage: number
	metrics: Metrics
	nextUpdate: string
	rpcInfo: RpcInfo
	calculation: Calculation
	error?: string
}

type RiskLevel = 'low' | 'moderate' | 'high' | 'critical'

// Configuration
const FORK_THRESHOLD_REP = 275000 // 2.5% of 11 million REP

// Public RPC endpoints (no API keys required!)
const PUBLIC_RPC_ENDPOINTS = [
	'https://eth.llamarpc.com', // LlamaRPC
	'https://main-light.eth.linkpool.io', // LinkPool
	'https://ethereum.publicnode.com', // PublicNode
	'https://1rpc.io/eth', // 1RPC
]

interface RpcConnection {
	provider: ethers.JsonRpcProvider
	endpoint: string
	latency: number
	fallbacksAttempted: number
}

// Risk level thresholds (percentage of fork threshold)
const RISK_LEVELS = {
	LOW: 10, // <10% of fork threshold
	MODERATE: 25, // 10-25% of threshold
	HIGH: 75, // 25-75% of threshold
	CRITICAL: 75, // >75% of threshold
}

/**
 * Retry wrapper for contract calls with exponential backoff
 */
async function retryContractCall<T>(
	operation: () => Promise<T>,
	methodName: string,
	maxRetries = 3
): Promise<T> {
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await operation()
		} catch (error) {
			const isLastAttempt = attempt === maxRetries
			const errorMessage = error instanceof Error ? error.message : String(error)
			
			if (isLastAttempt) {
				console.error(`✗ ${methodName} failed after ${maxRetries} attempts: ${errorMessage}`)
				throw error
			}
			
			const delay = Math.pow(2, attempt - 1) * 1000 // 1s, 2s, 4s
			console.warn(`⚠️ ${methodName} failed (attempt ${attempt}/${maxRetries}): ${errorMessage}`)
			console.log(`Retrying in ${delay}ms...`)
			
			await new Promise(resolve => setTimeout(resolve, delay))
		}
	}
	
	throw new Error(`Unexpected retry flow for ${methodName}`)
}

async function getWorkingProvider(): Promise<RpcConnection> {
	let fallbacksAttempted = 0

	// Try public RPC endpoints
	for (const rpc of PUBLIC_RPC_ENDPOINTS) {
		try {
			console.log(`Trying public RPC: ${rpc}`)
			const startTime = Date.now()
			const provider = new ethers.JsonRpcProvider(rpc, 'mainnet')
			await provider.getBlockNumber() // Test connection
			const latency = Date.now() - startTime
			console.log(`✓ Connected to: ${rpc} (${latency}ms)`)
			
			return {
				provider,
				endpoint: rpc,
				latency,
				fallbacksAttempted,
			}
		} catch (error) {
			console.log(
				`✗ Failed to connect to ${rpc}: ${error instanceof Error ? error.message : String(error)}`,
			)
			fallbacksAttempted++
		}
	}

	throw new Error(
		`All RPC endpoints failed (attempted ${fallbacksAttempted})`,
	)
}

async function loadContracts(provider: ethers.JsonRpcProvider): Promise<Record<string, ethers.Contract>> {
	const abiPath = path.join(__dirname, '../contracts/augur-abis.json')
	const abiData = await fs.readFile(abiPath, 'utf8')
	const abis = JSON.parse(abiData)

	// Initialize contract instances with correct names
	const contracts = {
		universe: new ethers.Contract(
			abis.universe.address,
			abis.universe.abi,
			provider,
		),
		augur: new ethers.Contract(
			abis.augur.address,
			abis.augur.abi,
			provider,
		),
		repV2Token: new ethers.Contract(
			abis.repV2Token.address,
			abis.repV2Token.abi,
			provider,
		),
		cash: new ethers.Contract(
			abis.cash.address,
			abis.cash.abi,
			provider,
		),
	}

	console.log('✓ Loaded contracts:')
	console.log(`  Universe: ${abis.universe.address}`)
	console.log(`  Augur: ${abis.augur.address}`)
	console.log(`  REPv2: ${abis.repV2Token.address}`)
	console.log(`  Cash: ${abis.cash.address}`)
	
	return contracts
}

/**
 * Execute contract operations with RPC fallback support
 */
async function executeWithRpcFallback<T>(
	operation: (connection: RpcConnection, contracts: Record<string, ethers.Contract>) => Promise<T>
): Promise<T> {
	let lastError: Error | null = null
	let fallbacksAttempted = 0
	
	// Try each RPC endpoint
	for (const rpc of PUBLIC_RPC_ENDPOINTS) {
		try {
			console.log(`Attempting operation with RPC: ${rpc}`)
			const startTime = Date.now()
			const provider = new ethers.JsonRpcProvider(rpc, 'mainnet')
			
			// Test connection
			await provider.getBlockNumber()
			const latency = Date.now() - startTime
			console.log(`✓ Connected to: ${rpc} (${latency}ms)`)
			
			const connection: RpcConnection = {
				provider,
				endpoint: rpc,
				latency,
				fallbacksAttempted
			}
			
			const contracts = await loadContracts(connection.provider)
			return await operation(connection, contracts)
			
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error))
			console.log(`✗ Operation failed with ${rpc}: ${lastError.message}`)
			fallbacksAttempted++
		}
	}
	
	throw lastError || new Error(`All RPC endpoints failed (attempted ${fallbacksAttempted})`)
}

async function calculateForkRisk(): Promise<ForkRiskData> {
	try {
		console.log('Starting fork risk calculation...')

		return await executeWithRpcFallback(async (connection, contracts) => {
			// Get current blockchain state
			const blockNumber = await connection.provider.getBlockNumber()
			console.log(`Block Number: ${blockNumber}`)
			const timestamp = new Date().toISOString()

			// Check if universe is already forking with retry logic
			let isForking = false
			try {
				isForking = await retryContractCall(
					() => contracts.universe.isForking(),
					'universe.isForking()'
				)
			} catch (error) {
				console.warn('⚠️ Failed to check forking status, continuing with dispute calculation')
				// Continue with graceful degradation
			}
			
			if (isForking) {
				console.log('⚠️ UNIVERSE IS FORKING! Setting maximum risk level')
				return getForkingResult(timestamp, blockNumber, connection)
			}

			// Calculate key metrics
			const activeDisputes = await getActiveDisputes(connection.provider, contracts)
			const largestDisputeBond = getLargestDisputeBond(activeDisputes)

			// Calculate risk level
			const forkThresholdPercent =
				(largestDisputeBond / FORK_THRESHOLD_REP) * 100
			const riskLevel = determineRiskLevel(forkThresholdPercent)
			const riskPercentage = forkThresholdPercent

			// Prepare results
			const results: ForkRiskData = {
				timestamp,
				blockNumber,
				riskLevel,
				riskPercentage: Math.min(100, Math.max(0, riskPercentage)),
				metrics: {
					largestDisputeBond,
					forkThresholdPercent: Math.round(forkThresholdPercent * 100) / 100,
					activeDisputes: activeDisputes.length,
					disputeDetails: activeDisputes.slice(0, 5), // Top 5 disputes
				},
				nextUpdate: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
				rpcInfo: {
					endpoint: connection.endpoint,
					latency: connection.latency,
					fallbacksAttempted: connection.fallbacksAttempted,
				},
				calculation: {
					method: 'GitHub Actions + Public RPC',
					forkThreshold: FORK_THRESHOLD_REP,
				},
			}

			console.log('Calculation completed successfully')
			console.log(`Risk Level: ${riskLevel}`)
			console.log(`Largest Dispute Bond: ${largestDisputeBond} REP`)
			console.log(`Fork Threshold: ${forkThresholdPercent.toFixed(2)}%`)
			console.log(`RPC Used: ${connection.endpoint} (${connection.latency}ms)`)
			console.log(`Block Number: ${blockNumber}`)

			return results
		})  // Close executeWithRpcFallback
	} catch (error) {
		console.error('Error calculating fork risk:', error)
		throw error // Don't return mock data - let the error bubble up
	}
}

async function getActiveDisputes(provider: ethers.JsonRpcProvider, contracts: Record<string, ethers.Contract>): Promise<DisputeDetails[]> {
	try {
		console.log('Querying dispute events for accurate stake calculation...')

		// Query events in smaller chunks due to RPC block limit (1000 blocks max)
		const currentBlock = await provider.getBlockNumber()
		const blocksPerDay = 7200 // Approximate blocks per day (12 second blocks)
		const searchPeriod = 7 * blocksPerDay // Last 7 days
		const fromBlock = currentBlock - searchPeriod

		const allCreatedEvents: ethers.EventLog[] = []
		const allContributionEvents: ethers.EventLog[] = []
		const allCompletedEvents: ethers.EventLog[] = []
		const chunkSize = 1000 // Max blocks per query for most RPC providers

		// Query all relevant events in chunks
		for (let start = fromBlock; start < currentBlock; start += chunkSize) {
			const end = Math.min(start + chunkSize - 1, currentBlock)

			try {
				// Query Created events (for dispute initialization)
				const createdFilter = contracts.augur.filters.DisputeCrowdsourcerCreated()
				const createdEvents = await contracts.augur.queryFilter(createdFilter, start, end)
				allCreatedEvents.push(...(createdEvents.filter(e => e instanceof ethers.EventLog) as ethers.EventLog[]))

				// Query Contribution events (for actual stake amounts - MOST IMPORTANT)
				const contributionFilter = contracts.augur.filters.DisputeCrowdsourcerContribution()
				const contributionEvents = await contracts.augur.queryFilter(contributionFilter, start, end)
				allContributionEvents.push(...(contributionEvents.filter(e => e instanceof ethers.EventLog) as ethers.EventLog[]))

				// Query Completed events (for finalized disputes)
				const completedFilter = contracts.augur.filters.DisputeCrowdsourcerCompleted()
				const completedEvents = await contracts.augur.queryFilter(completedFilter, start, end)
				allCompletedEvents.push(...(completedEvents.filter(e => e instanceof ethers.EventLog) as ethers.EventLog[]))

				const totalEvents = createdEvents.length + contributionEvents.length + completedEvents.length
				if (totalEvents > 0) {
					console.log(`Found ${totalEvents} dispute events in blocks ${start}-${end} (${createdEvents.length} created, ${contributionEvents.length} contributions, ${completedEvents.length} completed)`)
				}
			} catch (chunkError) {
				console.warn(
					`Failed to query blocks ${start}-${end}:`,
					chunkError instanceof Error
						? chunkError.message
						: String(chunkError),
				)
			}
		}

		console.log(`Total events found: ${allCreatedEvents.length} created, ${allContributionEvents.length} contributions, ${allCompletedEvents.length} completed`)

		// Create a map to track dispute crowdsourcer states
		const disputeStates = new Map<string, {
			marketId: string,
			currentStake: number,
			disputeRound: number,
			isCompleted: boolean,
			lastContributionTimestamp: number
		}>()

		// First, process Created events to initialize disputes
		for (const event of allCreatedEvents) {
			try {
				if (!event.args || !Array.isArray(event.args) || event.args.length < 6) continue

				const [_universe, marketAddress, disputeCrowdsourcerAddress, _payoutNumerators, initialSizeWei, _isInvalid] = event.args
				const initialSizeRep = Number(ethers.formatEther(initialSizeWei))

				disputeStates.set(disputeCrowdsourcerAddress, {
					marketId: marketAddress,
					currentStake: initialSizeRep, // Will be updated by contribution events
					disputeRound: 1, // Will be updated by contribution events
					isCompleted: false,
					lastContributionTimestamp: 0
				})
			} catch (error) {
				console.warn('Error processing created event:', error instanceof Error ? error.message : String(error))
			}
		}

		// Second, process Contribution events to get ACTUAL stake amounts
		for (const event of allContributionEvents) {
			try {
				if (!event.args || !Array.isArray(event.args) || event.args.length < 11) continue

				const [
					_universe, _reporter, marketAddress, disputeCrowdsourcerAddress,
					_amountStaked, _description, _payoutNumerators,
					currentStakeWei, _stakeRemaining, disputeRound, timestamp
				] = event.args

				const currentStakeRep = Number(ethers.formatEther(currentStakeWei))
				const disputeRoundNum = Number(disputeRound)
				const timestampNum = Number(timestamp)

				// Update or create dispute state with actual stake
				const existing = disputeStates.get(disputeCrowdsourcerAddress)
				if (existing) {
					// Update with latest contribution data
					existing.currentStake = currentStakeRep
					existing.disputeRound = disputeRoundNum
					existing.lastContributionTimestamp = Math.max(existing.lastContributionTimestamp, timestampNum)
				} else {
					// Create new entry if we missed the Created event
					disputeStates.set(disputeCrowdsourcerAddress, {
						marketId: marketAddress,
						currentStake: currentStakeRep,
						disputeRound: disputeRoundNum,
						isCompleted: false,
						lastContributionTimestamp: timestampNum
					})
				}
			} catch (error) {
				console.warn('Error processing contribution event:', error instanceof Error ? error.message : String(error))
			}
		}

		// Third, mark completed disputes
		for (const event of allCompletedEvents) {
			try {
				if (!event.args || !Array.isArray(event.args) || event.args.length < 11) continue

				const [_universe, marketAddress, disputeCrowdsourcerAddress] = event.args
				const existing = disputeStates.get(disputeCrowdsourcerAddress)
				if (existing) {
					existing.isCompleted = true
				}
			} catch (error) {
				console.warn('Error processing completed event:', error instanceof Error ? error.message : String(error))
			}
		}

		// Convert to DisputeDetails array, filtering out completed disputes
		const disputes: DisputeDetails[] = []
		for (const [disputeCrowdsourcerAddress, state] of disputeStates.entries()) {
			// Only include active (non-completed) disputes
			if (state.isCompleted) continue

			// Check if market is finalized (skip finalized markets)
			try {
				const marketContract = new ethers.Contract(
					state.marketId,
					[{
						constant: true,
						inputs: [],
						name: 'isFinalized',
						outputs: [{ name: '', type: 'bool' }],
						type: 'function',
					}],
					provider,
				)

				const isFinalized = await marketContract.isFinalized()
				if (isFinalized) continue
			} catch (_marketError) {
				// If we can't check finalization, assume it's active
			}

			// Create dispute details with ACTUAL stake from contribution events
			disputes.push({
				marketId: state.marketId,
				title: `Market ${state.marketId.substring(0, 10)}...`,
				disputeBondSize: state.currentStake, // This is the REAL stake amount!
				disputeRound: state.disputeRound,
				daysRemaining: 7, // Estimate based on dispute window
			})
		}

		// Sort by bond size (largest first) and return top 10
		const sortedDisputes = disputes.sort(
			(a, b) => b.disputeBondSize - a.disputeBondSize,
		)
		
		console.log(`Processed ${sortedDisputes.length} active disputes from ${disputeStates.size} total dispute crowdsourcers`)
		if (sortedDisputes.length > 0) {
			console.log(`Largest dispute bond: ${sortedDisputes[0].disputeBondSize.toLocaleString()} REP`)
		}

		return sortedDisputes.slice(0, 10)
	} catch (error) {
		console.warn(
			'Failed to query dispute events (contribution/completed), using empty array:',
			error instanceof Error ? error.message : String(error),
		)
		return []
	}
}

function getLargestDisputeBond(disputes: DisputeDetails[]): number {
	if (disputes.length === 0) return 0
	return Math.max(...disputes.map((d) => d.disputeBondSize))
}



function determineRiskLevel(forkThresholdPercent: number): RiskLevel {
	if (forkThresholdPercent > RISK_LEVELS.CRITICAL) return 'critical'
	if (forkThresholdPercent >= RISK_LEVELS.HIGH) return 'high'
	if (forkThresholdPercent >= RISK_LEVELS.MODERATE) return 'moderate'
	return 'low'
}

function getForkingResult(timestamp: string, blockNumber: number, connection: RpcConnection): ForkRiskData {
		return {
			timestamp,
			blockNumber,
			riskLevel: 'critical',
			riskPercentage: 100,
			metrics: {
				largestDisputeBond: FORK_THRESHOLD_REP, // Fork threshold was reached
				forkThresholdPercent: 100,
				activeDisputes: 0,
				disputeDetails: [
					{
						marketId: 'FORKING',
						title: 'Universe is currently forking',
						disputeBondSize: FORK_THRESHOLD_REP,
						disputeRound: 99,
						daysRemaining: 0,
					},
				],
			},
			nextUpdate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
			rpcInfo: {
				endpoint: connection.endpoint,
				latency: connection.latency,
				fallbacksAttempted: connection.fallbacksAttempted,
			},
			calculation: {
				method: 'Fork Detected',
				forkThreshold: FORK_THRESHOLD_REP,
			},
		}
	}

function getErrorResult(errorMessage: string): ForkRiskData {
		return {
			timestamp: new Date().toISOString(),
			riskLevel: 'unknown',
			riskPercentage: 0,
			error: errorMessage,
			metrics: {
				largestDisputeBond: 0,
				forkThresholdPercent: 0,
				activeDisputes: 0,
				disputeDetails: [],
			},
			nextUpdate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
			rpcInfo: {
				endpoint: null,
				latency: null,
				fallbacksAttempted: 0,
			},
			calculation: {
				method: 'Error',
				forkThreshold: FORK_THRESHOLD_REP,
			},
		}
	}

async function saveResults(results: ForkRiskData): Promise<void> {
		const outputPath = path.join(__dirname, '../public/data/fork-risk.json')

		// Ensure data directory exists
		await fs.mkdir(path.dirname(outputPath), { recursive: true })

		// Write results with pretty formatting
		await fs.writeFile(outputPath, JSON.stringify(results, null, 2))

		console.log(`Results saved to ${outputPath}`)
}

// Main execution
async function main(): Promise<void> {
	try {
		const results = await calculateForkRisk()
		await saveResults(results)

		console.log('\n✓ Fork risk calculation completed successfully')
		console.log(
			`Results saved using PUBLIC RPC: ${results.rpcInfo.endpoint}`,
		)
		process.exit(0)
	} catch (error) {
		console.error('\n✗ Fatal error during fork risk calculation:')
		console.error(
			`Error: ${error instanceof Error ? error.message : String(error)}`,
		)

		// Create an error result to save
		const errorResult: ForkRiskData = getErrorResult(
			error instanceof Error ? error.message : String(error)
		)

		try {
			await saveResults(errorResult)
			console.log('Error state saved to JSON file')
		} catch (saveError) {
			console.error(
				'Failed to save error state:',
				saveError instanceof Error ? saveError.message : String(saveError),
			)
		}

		process.exit(1)
	}
}

// Run if called directly (TypeScript/Node compatible)
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	main()
}
