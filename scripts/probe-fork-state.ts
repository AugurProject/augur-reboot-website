#!/usr/bin/env node
/**
 * Probe real on-chain Augur state beyond what calculate-fork-risk.ts sees today.
 *
 * - Walks the universe chain from genesis to the current active leaf.
 * - For each universe reports: isForking, forkingMarket, threshold, REP token.
 * - For a provided market, enumerates every dispute participant (crowdsourcer)
 *   and reads live stake/size directly from the crowdsourcer contract.
 *
 * Ad-hoc / read-only. No cache writes, no JSON outputs.
 *
 * Usage:
 *   bun scripts/probe-fork-state.ts [marketAddress ...]
 * Default market: 0x963eed85778cc23e2d4636cd4f29eecdf9827e9e (Artemis II, per blog).
 */

import { ethers } from 'ethers'

const GENESIS_UNIVERSE = '0xe991247b78f937d7b69cfc00f1a487a293557677'
const DEFAULT_MARKETS = ['0x963eed85778cc23e2d4636cd4f29eecdf9827e9e']

const RPCS = [
	process.env.ETH_RPC_URL,
	'https://ethereum-rpc.publicnode.com',
	'https://eth.drpc.org',
	'https://1rpc.io/eth',
].filter((x): x is string => !!x)

const UNIVERSE_ABI = [
	'function isForking() view returns (bool)',
	'function getForkingMarket() view returns (address)',
	'function getForkEndTime() view returns (uint256)',
	'function getParentUniverse() view returns (address)',
	'function getWinningChildUniverse() view returns (address)',
	'function getDisputeThresholdForFork() view returns (uint256)',
	'function getForkReputationGoal() view returns (uint256)',
	'function getReputationToken() view returns (address)',
	'function getChildUniverse(bytes32 parentPayoutDistributionHash) view returns (address)',
]

const MARKET_ABI = [
	'function getUniverse() view returns (address)',
	'function getNumParticipants() view returns (uint256)',
	'function participants(uint256 index) view returns (address)',
	'function getInitialReporter() view returns (address)',
	'function getWinningReportingParticipant() view returns (address)',
	'function isFinalized() view returns (bool)',
	'function getEndTime() view returns (uint256)',
	'function getNumberOfOutcomes() view returns (uint256)',
]

const PARTICIPANT_ABI = [
	'function getStake() view returns (uint256)',
	'function getSize() view returns (uint256)',
	'function getPayoutDistributionHash() view returns (bytes32)',
	'function getPayoutNumerator(uint256 index) view returns (uint256)',
]

async function connect(): Promise<ethers.JsonRpcProvider> {
	for (const rpc of RPCS) {
		try {
			const p = new ethers.JsonRpcProvider(rpc, 'mainnet')
			await p.getBlockNumber()
			console.log(`✓ RPC: ${rpc}`)
			return p
		} catch (e) {
			console.log(`✗ ${rpc}: ${(e as Error).message.slice(0, 80)}`)
		}
	}
	throw new Error('All RPCs failed')
}

async function safeCall<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
	try {
		return await fn()
	} catch (e) {
		console.log(`    ${label}: reverted (${(e as Error).message.slice(0, 60)})`)
		return null
	}
}

async function describeUniverse(provider: ethers.JsonRpcProvider, address: string, depth = 0) {
	const prefix = '  '.repeat(depth)
	const u = new ethers.Contract(address, UNIVERSE_ABI, provider)
	console.log(`\n${prefix}▶ Universe ${address}`)

	const parent = await safeCall('parent', () => u.getParentUniverse())
	const isForking = await safeCall('isForking', () => u.isForking())
	const forkingMarket = await safeCall('forkingMarket', () => u.getForkingMarket())
	const forkEnd = await safeCall('forkEndTime', () => u.getForkEndTime())
	const threshold = await safeCall('threshold', () => u.getDisputeThresholdForFork())
	const repToken = await safeCall('repToken', () => u.getReputationToken())

	console.log(`${prefix}  parent:        ${parent ?? '?'}`)
	console.log(`${prefix}  isForking:     ${isForking}`)
	console.log(`${prefix}  forkingMarket: ${forkingMarket}`)
	if (forkEnd !== null && Number(forkEnd) > 0) {
		console.log(`${prefix}  forkEndTime:   ${new Date(Number(forkEnd) * 1000).toISOString()}`)
	}
	if (threshold !== null) {
		console.log(`${prefix}  threshold:     ${ethers.formatEther(threshold)} REP`)
	}
	console.log(`${prefix}  repToken:      ${repToken ?? '?'}`)

	// Try to follow to a winning child (only meaningful post-fork)
	const winner = await safeCall('winningChild', () => u.getWinningChildUniverse())
	if (winner && winner !== ethers.ZeroAddress) {
		console.log(`${prefix}  → winningChildUniverse: ${winner}`)
		await describeUniverse(provider, winner, depth + 1)
	}
	return { address, isForking, forkingMarket, threshold, winner }
}

async function describeMarket(provider: ethers.JsonRpcProvider, marketAddress: string) {
	console.log(`\n━━━ Market ${marketAddress} ━━━`)
	const m = new ethers.Contract(marketAddress, MARKET_ABI, provider)

	const code = await provider.getCode(marketAddress)
	if (code === '0x') {
		console.log('  (no contract deployed at this address)')
		return
	}

	const universe = await safeCall('universe', () => m.getUniverse())
	const numParticipants = await safeCall('numParticipants', () => m.getNumParticipants())
	const numOutcomes = await safeCall('numOutcomes', () => m.getNumberOfOutcomes())
	const isFinalized = await safeCall('isFinalized', () => m.isFinalized())
	const endTime = await safeCall('endTime', () => m.getEndTime())
	const winning = await safeCall('winningParticipant', () => m.getWinningReportingParticipant())

	console.log(`  universe:          ${universe}`)
	console.log(`  numOutcomes:       ${numOutcomes}`)
	console.log(`  numParticipants:   ${numParticipants}`)
	console.log(`  isFinalized:       ${isFinalized}`)
	if (endTime !== null) {
		console.log(`  endTime:           ${new Date(Number(endTime) * 1000).toISOString()}`)
	}
	console.log(`  winningParticipant:${winning ?? 'n/a'}`)

	if (universe) {
		await describeUniverse(provider, universe, 1)
	}

	if (numParticipants === null) return
	const n = Number(numParticipants)
	console.log(`\n  Dispute participants (${n}):`)
	let largestStake = 0n
	for (let i = 0; i < n; i++) {
		const pAddr = await safeCall(`participants(${i})`, () => m.participants(i))
		if (!pAddr) continue
		const c = new ethers.Contract(pAddr, PARTICIPANT_ABI, provider)
		const stake = (await safeCall('getStake', () => c.getStake())) ?? 0n
		const size = (await safeCall('getSize', () => c.getSize())) ?? 0n
		const hash = await safeCall('payoutHash', () => c.getPayoutDistributionHash())
		const nOut = numOutcomes !== null ? Number(numOutcomes) : 0
		const numerators: string[] = []
		for (let k = 0; k < nOut; k++) {
			const v = await safeCall(`num[${k}]`, () => c.getPayoutNumerator(k))
			numerators.push(v === null ? '?' : String(v))
		}
		const stakeRep = Number(ethers.formatEther(stake))
		if (stake > largestStake) largestStake = stake
		console.log(
			`    [${i}] ${pAddr}  stake=${stakeRep.toLocaleString()} REP  size=${Number(
				ethers.formatEther(size),
			).toLocaleString()}  payout=[${numerators.join(',')}]  hash=${String(hash).slice(0, 12)}…`,
		)
	}
	console.log(`\n  ▶ largest participant stake: ${Number(ethers.formatEther(largestStake)).toLocaleString()} REP`)
}

async function main() {
	const markets = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_MARKETS
	const provider = await connect()
	const block = await provider.getBlockNumber()
	console.log(`Block: ${block}`)

	console.log('\n=============== GENESIS UNIVERSE ===============')
	await describeUniverse(provider, GENESIS_UNIVERSE)

	for (const market of markets) {
		await describeMarket(provider, market)
	}
}

main().catch((e) => {
	console.error(e)
	process.exit(1)
})
