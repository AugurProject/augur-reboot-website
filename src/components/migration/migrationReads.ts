/**
 * On-chain reads for the Moon Fork REP migration (live, client-side, ethers v6).
 *
 * Light read-only calls — no event scanning — so this runs in the browser on
 * page load (unlike the heavier fork-risk pipeline in scripts/calculate-fork-risk.ts).
 *
 * Gotchas baked in here (verified on mainnet, 2026-06):
 *  - The migrated child-universe's outcome name comes from its REP token symbol()
 *    (e.g. "REPv2_Yes_1" → "Yes"), NOT from positional [Invalid,No,Yes] guessing.
 *  - "REP migrated to REPv2" = REPv1.balanceOf(0x..01) (Augur sends migrated v1
 *    to address(1)), NOT balanceOf(the REPv2 contract).
 *  - payout distribution hash = keccak256(abi.encodePacked(uint256[] payout)).
 *  - Fork values come from Universe.sol: threshold = theoretical/40 (2.5%),
 *    goal = theoretical/2 (50%). Progress below is shown vs the 11M REP cap.
 */
import { ethers } from 'ethers'

// Public mainnet RPCs (same set as scripts/calculate-fork-risk.ts), tried in order.
const RPC_ENDPOINTS = [
	'https://ethereum-rpc.publicnode.com',
	'https://eth.drpc.org',
	'https://cloudflare-eth.com',
	'https://1rpc.io/eth',
]

export const MIGRATION_ADDRESSES = {
	genesisUniverse: '0x49244BD018Ca9fd1f06ecC07B9E9De773246e5AA',
	repV2: '0x221657776846890989a759BA2973e427DfF5C9bB', // current Genesis REPv2
	repV1: '0x1985365e9f78359a9B6AD760e32412f4a445E862', // legacy REPv1
	newUniverseRepToken: '0xCf6A0A7826fa124B7705d6f3c675eAD76f1e540D', // forked-universe REP ("REPv2_Yes_1")
	migrationSink: '0x0000000000000000000000000000000000000001', // where migrated REPv1 is sent
} as const

const UNIVERSE_ABI = [
	'function isForking() view returns (bool)',
	'function getForkEndTime() view returns (uint256)',
	'function getForkingMarket() view returns (address)',
	'function getChildUniverse(bytes32) view returns (address)',
	'function getReputationToken() view returns (address)',
]
const REP_ABI = [
	'function totalSupply() view returns (uint256)',
	'function balanceOf(address) view returns (uint256)',
	'function symbol() view returns (string)',
	'function getTotalTheoreticalSupply() view returns (uint256)',
]
const MARKET_ABI = [
	'function getNumberOfOutcomes() view returns (uint256)',
	'function getNumTicks() view returns (uint256)',
]

const toNum = (v: bigint): number => Number(ethers.formatEther(v))

let cachedProvider: ethers.JsonRpcProvider | undefined
async function getProvider(): Promise<ethers.JsonRpcProvider> {
	if (cachedProvider) return cachedProvider
	for (const url of RPC_ENDPOINTS) {
		try {
			const p = new ethers.JsonRpcProvider(url, 'mainnet', { staticNetwork: true })
			await p.getBlockNumber()
			cachedProvider = p
			return p
		} catch { /* try next */ }
	}
	throw new Error('All public RPC endpoints were unreachable')
}

export interface MigrationSnapshot {
	isForking: boolean
	forkEndTime: number | undefined // unix seconds (migration deadline)
	forkingMarket: string | undefined
	migratedRep: number             // REP moved into child universes (sum)
	leadingOutcome: string | undefined
	totalRep: number                // 11M REP cap (REPv1 total supply) — progress denominator
	forkGoal: number                // 50% of theoretical REPv2 supply
}

function outcomeFromSymbol(symbol: string, fallback: string): string {
	const m = symbol.match(/^REPv2_(.+)_\d+$/)
	return m && m[1] ? m[1] : fallback
}

export async function getMigrationSnapshot(): Promise<MigrationSnapshot> {
	const provider = await getProvider()
	const universe = new ethers.Contract(MIGRATION_ADDRESSES.genesisUniverse, UNIVERSE_ABI, provider)
	const repV2 = new ethers.Contract(MIGRATION_ADDRESSES.repV2, REP_ABI, provider)
	const repV1 = new ethers.Contract(MIGRATION_ADDRESSES.repV1, REP_ABI, provider)

	const [isForking, theoretical, totalRepRaw] = await Promise.all([
		universe.isForking() as Promise<boolean>,
		repV2.getTotalTheoreticalSupply() as Promise<bigint>,
		repV1.totalSupply() as Promise<bigint>,
	])

	const snapshot: MigrationSnapshot = {
		isForking,
		forkEndTime: undefined,
		forkingMarket: undefined,
		migratedRep: 0,
		leadingOutcome: undefined,
		totalRep: toNum(totalRepRaw),
		forkGoal: toNum(theoretical) / 2,
	}
	if (!isForking) return snapshot

	const [forkEndTime, forkingMarket] = await Promise.all([
		universe.getForkEndTime() as Promise<bigint>,
		universe.getForkingMarket() as Promise<string>,
	])
	snapshot.forkEndTime = Number(forkEndTime)
	snapshot.forkingMarket = forkingMarket

	// Enumerate the forking market's outcomes → child universes → migrated REP.
	const market = new ethers.Contract(forkingMarket, MARKET_ABI, provider)
	const [numOutcomesRaw, numTicks] = await Promise.all([
		market.getNumberOfOutcomes() as Promise<bigint>,
		market.getNumTicks() as Promise<bigint>,
	])
	const numOutcomes = Number(numOutcomesRaw)
	let migrated = 0n
	let leadingSupply = 0n
	let leadingOutcome: string | undefined
	for (let i = 0; i < numOutcomes; i++) {
		const payout = Array.from({ length: numOutcomes }, (_v, j) => (j === i ? numTicks : 0n))
		const hash = ethers.solidityPackedKeccak256(['uint256[]'], [payout])
		const child = (await universe.getChildUniverse(hash)) as string
		if (BigInt(child) === 0n) continue
		const childUni = new ethers.Contract(child, UNIVERSE_ABI, provider)
		const repToken = (await childUni.getReputationToken()) as string
		const rep = new ethers.Contract(repToken, REP_ABI, provider)
		const [supply, symbol] = await Promise.all([rep.totalSupply() as Promise<bigint>, rep.symbol() as Promise<string>])
		migrated += supply
		if (supply > leadingSupply) { leadingSupply = supply; leadingOutcome = outcomeFromSymbol(symbol, `Outcome ${i}`) }
	}
	snapshot.migratedRep = toNum(migrated)
	snapshot.leadingOutcome = leadingOutcome
	return snapshot
}

export interface AddressRep { repV1: number; repV2: number; newUniverse: number }

export async function getAddressRep(address: string): Promise<AddressRep> {
	const provider = await getProvider()
	const a = address.toLowerCase()
	const repV1 = new ethers.Contract(MIGRATION_ADDRESSES.repV1, REP_ABI, provider)
	const repV2 = new ethers.Contract(MIGRATION_ADDRESSES.repV2, REP_ABI, provider)
	const repNew = new ethers.Contract(MIGRATION_ADDRESSES.newUniverseRepToken, REP_ABI, provider)
	const [v1, v2, nu] = await Promise.all([
		repV1.balanceOf(a) as Promise<bigint>,
		repV2.balanceOf(a) as Promise<bigint>,
		repNew.balanceOf(a) as Promise<bigint>,
	])
	return { repV1: toNum(v1), repV2: toNum(v2), newUniverse: toNum(nu) }
}
