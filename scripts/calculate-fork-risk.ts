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

type RiskLevel = 'none' | 'low' | 'moderate' | 'high' | 'critical' | 'unknown'

interface ForkRiskData {
	timestamp: string
	lastUpdated: string
	blockNumber?: number
	riskLevel: RiskLevel
	riskPercentage: number
	metrics: Metrics
	nextUpdate: string
	rpcInfo: RpcInfo
	calculation: Calculation
	error?: string
	cacheValidation?: {
		isHealthy: boolean
		discrepancy?: string
	}
}

// Cache interfaces for incremental event caching
interface SerializedEventLog {
	blockNumber: number
	transactionHash: string
	disputeCrowdsourcerAddress: string
	marketAddress: string
	args: Array<string | number>
	eventType: 'created' | 'contribution' | 'completed'
}

interface EventCache {
	version: string
	lastQueriedBlock: number
	lastQueriedTimestamp: string
	oldestEventBlock: number
	events: {
		created: SerializedEventLog[]
		contributions: SerializedEventLog[]
		completed: SerializedEventLog[]
	}
	metadata: {
		totalEventsTracked: number
		cacheGeneratedAt: string
		blockchainSyncStatus: 'complete' | 'partial' | 'stale'
	}
}

interface CacheValidationResult {
	isHealthy: boolean
	discrepancy?: string
}

// Configuration
const FORK_THRESHOLD_REP = 275000 // 2.5% of 11 million REP
const CACHE_VERSION = '1.0.0'
const FINALITY_DEPTH = 32 // Ethereum finality depth (~6.4 minutes)
const VALIDATION_DEPTH = 8 // blocks (detects corruption within ~2 minutes)

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

			const delay = 2 ** (attempt - 1) * 1000 // 1s, 2s, 4s
			console.warn(`⚠️ ${methodName} failed (attempt ${attempt}/${maxRetries}): ${errorMessage}`)
			console.log(`Retrying in ${delay}ms...`)

			await new Promise(resolve => setTimeout(resolve, delay))
		}
	}

	throw new Error(`Unexpected retry flow for ${methodName}`)
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
		// Detect calculation mode from environment
		const mode = process.env.CALCULATION_MODE || 'incremental'
		console.log(`[Mode] ${mode === 'full-rebuild' ? 'FULL REBUILD' : 'INCREMENTAL'} mode`)

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
			} catch {
				console.warn('⚠️ Failed to check forking status, continuing with dispute calculation')
				// Continue with graceful degradation
			}

			if (isForking) {
				console.log('⚠️ UNIVERSE IS FORKING! Setting maximum risk level')
				return getForkingResult(timestamp, blockNumber, connection)
			}

			// Calculate key metrics
			const activeDisputes = await getActiveDisputes(connection.provider, contracts, mode)
			const largestDisputeBond = getLargestDisputeBond(activeDisputes)

			// Validate cache health
			const cache = await loadEventCache()
			const cacheValidation = await validateCacheHealth(connection.provider, contracts, cache)

			if (!cacheValidation.isHealthy) {
				console.error(`❌ Cache validation failed: ${cacheValidation.discrepancy}`)
				console.error('⚠️  Consider triggering Cache Rebuild job to repair the cache')
			}

			// Calculate risk level
			const forkThresholdPercent =
				(largestDisputeBond / FORK_THRESHOLD_REP) * 100
			const riskLevel = determineRiskLevel(forkThresholdPercent)
			const riskPercentage = forkThresholdPercent

			// Prepare results
			const results: ForkRiskData = {
				timestamp,
				lastUpdated: new Date().toISOString(),
				blockNumber,
				riskLevel,
				riskPercentage: Math.min(100, Math.max(0, riskPercentage)),
				metrics: {
					largestDisputeBond,
					forkThresholdPercent: Math.round(forkThresholdPercent * 100) / 100,
					activeDisputes: activeDisputes.length,
					disputeDetails: activeDisputes.slice(0, 5), // Top 5 disputes
				},
					rpcInfo: {
					endpoint: connection.endpoint,
					latency: connection.latency,
					fallbacksAttempted: connection.fallbacksAttempted,
				},
				calculation: {
						forkThreshold: FORK_THRESHOLD_REP,
				},
				cacheValidation,
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

/**
 * Detect if error is due to rate limiting
 */
function isRateLimitError(error: unknown): boolean {
	const errorMessage = error instanceof Error ? error.message : String(error)
	return (
		errorMessage.includes('429') ||
		errorMessage.includes('Too Many Requests') ||
		errorMessage.includes('error code: 1015') ||
		errorMessage.includes('rate limit') ||
		errorMessage.includes('exceeded maximum retry limit')
	)
}

/**
 * Cache Management Functions
 * These functions handle incremental event caching to reduce RPC calls
 */

/**
 * Load event cache from disk or create empty cache
 */
async function loadEventCache(): Promise<EventCache> {
	const cachePath = path.join(__dirname, '../public/cache/event-cache.json')

	try {
		const cacheData = await fs.readFile(cachePath, 'utf8')
		const cache: EventCache = JSON.parse(cacheData)

		if (!validateCache(cache)) {
			console.warn('Cache validation failed, creating new cache')
			return createEmptyCache()
		}

		console.log(`✓ Cache loaded: ${cache.metadata.totalEventsTracked} events tracked`)
		return cache
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			console.log('No cache found, will perform full query')
		} else {
			console.warn(`Cache load error: ${error instanceof Error ? error.message : String(error)}`)
		}
		return createEmptyCache()
	}
}

/**
 * Create empty cache structure
 */
function createEmptyCache(): EventCache {
	return {
		version: CACHE_VERSION,
		lastQueriedBlock: 0,
		lastQueriedTimestamp: new Date().toISOString(),
		oldestEventBlock: 0,
		events: {
			created: [],
			contributions: [],
			completed: []
		},
		metadata: {
			totalEventsTracked: 0,
			cacheGeneratedAt: new Date().toISOString(),
			blockchainSyncStatus: 'stale'
		}
	}
}

/**
 * Save event cache to disk
 */
async function saveEventCache(cache: EventCache): Promise<void> {
	const cachePath = path.join(__dirname, '../public/cache/event-cache.json')

	try {
		// Ensure cache directory exists
		await fs.mkdir(path.dirname(cachePath), { recursive: true })

		// Update metadata
		cache.metadata.cacheGeneratedAt = new Date().toISOString()
		cache.metadata.totalEventsTracked =
			cache.events.created.length +
			cache.events.contributions.length +
			cache.events.completed.length

		// Write cache with pretty formatting for readability
		await fs.writeFile(cachePath, JSON.stringify(cache, null, 2))

		console.log(`✓ Cache saved: ${cache.metadata.totalEventsTracked} events`)
	} catch (error) {
		console.error(`Failed to save cache: ${error instanceof Error ? error.message : String(error)}`)
		// Non-fatal error - script can continue without cache
	}
}

/**
 * Validate cache integrity and version compatibility
 */
function validateCache(cache: EventCache): boolean {
	// Check version compatibility
	if (cache.version !== CACHE_VERSION) {
		console.warn(`Cache version mismatch: ${cache.version} (expected ${CACHE_VERSION})`)
		return false
	}

	// Check required fields
	if (!cache.lastQueriedBlock || !cache.events) {
		console.warn('Cache missing required fields')
		return false
	}

	// Check block number sanity
	if (cache.lastQueriedBlock < 0 || cache.lastQueriedBlock > 999999999) {
		console.warn('Cache has invalid block number')
		return false
	}

	// Check event array integrity
	const totalEvents =
		cache.events.created.length +
		cache.events.contributions.length +
		cache.events.completed.length

	if (totalEvents !== cache.metadata.totalEventsTracked) {
		console.warn('Cache event count mismatch')
		return false
	}

	return true
}

/**
 * Serialize ethers.EventLog to plain JSON
 */
function serializeEvent(
	event: ethers.EventLog,
	eventType: 'created' | 'contribution' | 'completed'
): SerializedEventLog {
	return {
		blockNumber: event.blockNumber,
		transactionHash: event.transactionHash,
		disputeCrowdsourcerAddress: event.args?.[2] || '',
		marketAddress: event.args?.[1] || '',
		args: event.args ? event.args.map(arg => String(arg)) : [],
		eventType
	}
}

/**
 * Prune events older than 7 days from cache
 */
function pruneOldEvents(cache: EventCache, currentBlock: number): EventCache {
	const blocksPerDay = 7200
	const searchPeriod = 7 * blocksPerDay
	const cutoffBlock = currentBlock - searchPeriod

	const prunedCache: EventCache = {
		...cache,
		events: {
			created: cache.events.created.filter(e => e.blockNumber >= cutoffBlock),
			contributions: cache.events.contributions.filter(e => e.blockNumber >= cutoffBlock),
			completed: cache.events.completed.filter(e => e.blockNumber >= cutoffBlock)
		},
		oldestEventBlock: cutoffBlock
	}

	const eventsRemoved = cache.metadata.totalEventsTracked -
		(prunedCache.events.created.length +
		 prunedCache.events.contributions.length +
		 prunedCache.events.completed.length)

	if (eventsRemoved > 0) {
		console.log(`Pruned ${eventsRemoved} old events (older than block ${cutoffBlock})`)
	}

	return prunedCache
}

async function getActiveDisputes(provider: ethers.JsonRpcProvider, contracts: Record<string, ethers.Contract>, mode: string = 'incremental'): Promise<DisputeDetails[]> {
	try {
		console.log('Querying dispute events for accurate stake calculation...')

		// Load event cache for incremental queries
		const cache = await loadEventCache()

		// Query events in smaller chunks due to RPC block limit (1000 blocks max)
		const currentBlock = await provider.getBlockNumber()
		const blocksPerDay = 7200 // Approximate blocks per day (12 second blocks)
		const searchPeriod = 7 * blocksPerDay // Last 7 days (~50,400 blocks)
		const fullSearchStartBlock = currentBlock - searchPeriod

		// Determine query range based on mode and cache
		let fromBlock: number
		let newEventsOnly = false

		if (mode === 'full-rebuild' || !cache.lastQueriedBlock || cache.lastQueriedBlock === 0) {
			// Full 7-day rescan
			fromBlock = Math.max(currentBlock - searchPeriod, 0)
			console.log(`[Query] Full 7-day rescan: blocks ${fromBlock} to ${currentBlock}`)
		} else {
			// Incremental: only new blocks since last query
			fromBlock = Math.max(cache.lastQueriedBlock - FINALITY_DEPTH, 0)
			newEventsOnly = true
			const blocksToQuery = currentBlock - fromBlock
			console.log(`[Query] Incremental: blocks ${fromBlock} to ${currentBlock} (~${blocksToQuery} blocks)`)
			console.log(`💾 Cache contains ${cache.metadata.totalEventsTracked} events`)
		}

		// Initialize event arrays
		// For incremental queries, start with cached events
		const allCreatedEvents: ethers.EventLog[] = []
		const allContributionEvents: ethers.EventLog[] = []
		const allCompletedEvents: ethers.EventLog[] = []
		const chunkSize = 1000 // Max blocks per query for most RPC providers

		let consecutiveFailures = 0
		let totalChunks = 0
		let successfulChunks = 0
		let newEventsFound = 0

		// Query all relevant events in chunks
		for (let start = fromBlock; start < currentBlock; start += chunkSize) {
			const end = Math.min(start + chunkSize - 1, currentBlock)
			totalChunks++

			try {
				// Add small delay between chunks to avoid rate limiting (100ms)
				if (totalChunks > 1) {
					await new Promise(resolve => setTimeout(resolve, 100))
				}

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
				newEventsFound += totalEvents
				if (totalEvents > 0) {
					console.log(`Found ${totalEvents} dispute events in blocks ${start}-${end} (${createdEvents.length} created, ${contributionEvents.length} contributions, ${completedEvents.length} completed)`)
				}

				consecutiveFailures = 0
				successfulChunks++
			} catch (chunkError) {
				consecutiveFailures++
				const errorMessage = chunkError instanceof Error ? chunkError.message : String(chunkError)

				// Detect rate limiting
				if (isRateLimitError(chunkError)) {
					console.warn(`⚠️ Rate limit detected on blocks ${start}-${end}, backing off...`)
					// Exponential backoff for rate limits (2s, 4s, 8s)
					const backoffDelay = Math.min(2 ** consecutiveFailures * 1000, 10000)
					console.log(`Waiting ${backoffDelay}ms before continuing...`)
					await new Promise(resolve => setTimeout(resolve, backoffDelay))
				} else {
					console.warn(`Failed to query blocks ${start}-${end}: ${errorMessage}`)
				}

				// If we've had too many consecutive failures, stop to avoid wasting time
				if (consecutiveFailures >= 5) {
					console.warn(`⚠️ Too many consecutive failures (${consecutiveFailures}), stopping chunk queries early`)
					console.log(`Successfully queried ${successfulChunks}/${totalChunks} chunks so far, using partial data`)
					break
				}
			}
		}

		console.log(`Chunk query complete: ${successfulChunks}/${totalChunks} successful`)

		console.log(`New events found: ${newEventsFound} (${allCreatedEvents.length} created, ${allContributionEvents.length} contributions, ${allCompletedEvents.length} completed)`)

		// Merge with cached events if this was an incremental query
		if (newEventsOnly && cache.lastQueriedBlock > 0) {
			// Load cached events (but filter out events from the re-queried finality window to avoid duplicates)
			const finalityStartBlock = cache.lastQueriedBlock - FINALITY_DEPTH

			for (const cachedEvent of cache.events.created) {
				if (cachedEvent.blockNumber < finalityStartBlock) {
					// Reconstruct minimal EventLog for processing
					const reconstructed = {
						blockNumber: cachedEvent.blockNumber,
						transactionHash: cachedEvent.transactionHash,
						args: cachedEvent.args
					} as ethers.EventLog
					allCreatedEvents.push(reconstructed)
				}
			}

			for (const cachedEvent of cache.events.contributions) {
				if (cachedEvent.blockNumber < finalityStartBlock) {
					const reconstructed = {
						blockNumber: cachedEvent.blockNumber,
						transactionHash: cachedEvent.transactionHash,
						args: cachedEvent.args
					} as ethers.EventLog
					allContributionEvents.push(reconstructed)
				}
			}

			for (const cachedEvent of cache.events.completed) {
				if (cachedEvent.blockNumber < finalityStartBlock) {
					const reconstructed = {
						blockNumber: cachedEvent.blockNumber,
						transactionHash: cachedEvent.transactionHash,
						args: cachedEvent.args
					} as ethers.EventLog
					allCompletedEvents.push(reconstructed)
				}
			}

			console.log(`📦 Merged with cached events: total ${allCreatedEvents.length + allContributionEvents.length + allCompletedEvents.length} events`)
		}

		// Update cache with newly queried events
		const updatedCache: EventCache = {
			version: CACHE_VERSION,
			lastQueriedBlock: currentBlock,
			lastQueriedTimestamp: new Date().toISOString(),
			oldestEventBlock: fullSearchStartBlock,
			events: {
				created: allCreatedEvents.map(e => serializeEvent(e, 'created')),
				contributions: allContributionEvents.map(e => serializeEvent(e, 'contribution')),
				completed: allCompletedEvents.map(e => serializeEvent(e, 'completed'))
			},
			metadata: {
				totalEventsTracked: allCreatedEvents.length + allContributionEvents.length + allCompletedEvents.length,
				cacheGeneratedAt: new Date().toISOString(),
				blockchainSyncStatus: successfulChunks === totalChunks ? 'complete' : 'partial'
			}
		}

		// Prune old events (older than 7 days)
		const prunedCache = pruneOldEvents(updatedCache, currentBlock)

		// Save cache for next run
		await saveEventCache(prunedCache)

		// Log cache efficiency metrics
		if (newEventsOnly) {
			const blocksQueried = currentBlock - fromBlock
			const fullQueryBlocks = searchPeriod
			const queriesSaved = Math.floor(fullQueryBlocks / 1000) - Math.floor(blocksQueried / 1000)
			console.log(`💰 RPC queries saved: ~${queriesSaved} queries (queried ${blocksQueried} blocks instead of ${fullQueryBlocks})`)
		}

		console.log(`Total events after pruning: ${prunedCache.metadata.totalEventsTracked}`)

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

				const [_universe, _marketAddress, disputeCrowdsourcerAddress] = event.args
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
		for (const [_disputeCrowdsourcerAddress, state] of disputeStates.entries()) {
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
	if (forkThresholdPercent === 0) return 'none'
	if (forkThresholdPercent > RISK_LEVELS.CRITICAL) return 'critical'
	if (forkThresholdPercent >= RISK_LEVELS.HIGH) return 'high'
	if (forkThresholdPercent >= RISK_LEVELS.MODERATE) return 'moderate'
	return 'low'
}

function getForkingResult(timestamp: string, blockNumber: number, connection: RpcConnection): ForkRiskData {
		return {
			lastRiskChange: new Date().toISOString(),
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
			lastUpdated: new Date().toISOString(),
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

/**
 * Validate cache health by re-querying last N blocks fresh and comparing against cached data
 * This detects cache corruption from blockchain reorganizations
 */
async function validateCacheHealth(
	provider: ethers.JsonRpcProvider,
	contracts: Record<string, ethers.Contract>,
	cache: EventCache
): Promise<CacheValidationResult> {
	try {
		// Return early if no cached data
		if (cache.lastQueriedBlock === 0 || cache.metadata.totalEventsTracked === 0) {
			console.log('ℹ️  Cache validation skipped: no cached data to validate')
			return { isHealthy: true }
		}

		const currentBlock = await provider.getBlockNumber()
		const validationStartBlock = Math.max(
			currentBlock - VALIDATION_DEPTH,
			cache.oldestEventBlock
		)

		console.log(`🔍 Validating cache health: re-querying blocks ${validationStartBlock}-${currentBlock}`)

		// Re-query last N blocks fresh (without cache)
		const freshCreatedEvents: ethers.EventLog[] = []
		const freshContributionEvents: ethers.EventLog[] = []
		const freshCompletedEvents: ethers.EventLog[] = []

		try {
			// Query Created events fresh
			const createdFilter = contracts.augur.filters.DisputeCrowdsourcerCreated()
			const createdEvents = await contracts.augur.queryFilter(createdFilter, validationStartBlock, currentBlock)
			freshCreatedEvents.push(...(createdEvents.filter(e => e instanceof ethers.EventLog) as ethers.EventLog[]))

			// Query Contribution events fresh
			const contributionFilter = contracts.augur.filters.DisputeCrowdsourcerContribution()
			const contributionEvents = await contracts.augur.queryFilter(contributionFilter, validationStartBlock, currentBlock)
			freshContributionEvents.push(...(contributionEvents.filter(e => e instanceof ethers.EventLog) as ethers.EventLog[]))

			// Query Completed events fresh
			const completedFilter = contracts.augur.filters.DisputeCrowdsourcerCompleted()
			const completedEvents = await contracts.augur.queryFilter(completedFilter, validationStartBlock, currentBlock)
			freshCompletedEvents.push(...(completedEvents.filter(e => e instanceof ethers.EventLog) as ethers.EventLog[]))

			console.log(`Found ${freshCreatedEvents.length + freshContributionEvents.length + freshCompletedEvents.length} fresh events in validation window`)
		} catch (queryError) {
			const errorMessage = queryError instanceof Error ? queryError.message : String(queryError)
			console.warn(`⚠️  Validation query failed: ${errorMessage}`)
			return { isHealthy: false, discrepancy: `Query failed: ${errorMessage}` }
		}

		// Extract dispute IDs from fresh events
		const freshDisputeIds = new Set<string>()

		for (const event of freshCreatedEvents) {
			if (event.args?.[2]) {
				freshDisputeIds.add(String(event.args[2]))
			}
		}

		for (const event of freshContributionEvents) {
			if (event.args?.[3]) {
				freshDisputeIds.add(String(event.args[3]))
			}
		}

		for (const event of freshCompletedEvents) {
			if (event.args?.[2]) {
				freshDisputeIds.add(String(event.args[2]))
			}
		}

		// Extract dispute IDs from cached events in validation window
		const cachedDisputeIds = new Set<string>()

		for (const event of cache.events.created) {
			if (event.blockNumber >= validationStartBlock && event.blockNumber <= currentBlock) {
				cachedDisputeIds.add(event.disputeCrowdsourcerAddress)
			}
		}

		for (const event of cache.events.contributions) {
			if (event.blockNumber >= validationStartBlock && event.blockNumber <= currentBlock) {
				cachedDisputeIds.add(event.disputeCrowdsourcerAddress)
			}
		}

		for (const event of cache.events.completed) {
			if (event.blockNumber >= validationStartBlock && event.blockNumber <= currentBlock) {
				cachedDisputeIds.add(event.disputeCrowdsourcerAddress)
			}
		}

		// Compare fresh vs cached dispute sets
		const freshOnly = Array.from(freshDisputeIds).filter(id => !cachedDisputeIds.has(id))
		const cachedOnly = Array.from(cachedDisputeIds).filter(id => !freshDisputeIds.has(id))

		if (freshOnly.length > 0 || cachedOnly.length > 0) {
			const discrepancy = `Fresh: ${freshOnly.length} missing from cache, Cached: ${cachedOnly.length} not in fresh data`
			console.warn(`⚠️  Cache discrepancy detected: ${discrepancy}`)
			console.warn(`   Fresh disputes: ${freshDisputeIds.size}, Cached disputes: ${cachedDisputeIds.size}`)
			return { isHealthy: false, discrepancy }
		}

		console.log(`✓ Cache validation passed: fresh and cached disputes match in blocks ${validationStartBlock}-${currentBlock}`)
		return { isHealthy: true }
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		console.warn(`⚠️  Unexpected error during cache validation: ${errorMessage}`)
		// Return unhealthy but don't crash - validation errors shouldn't block the script
		return { isHealthy: false, discrepancy: `Validation error: ${errorMessage}` }
	}
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
