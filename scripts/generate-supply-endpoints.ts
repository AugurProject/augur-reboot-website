#!/usr/bin/env node

/**
 * REP Supply Endpoint Generator
 *
 * Reads ERC-20 totalSupply() of REPv2_Yes_1 — current REP, the token of the
 * winning/canonical child universe of the Moon Fork — on Ethereum mainnet
 * and writes the supply endpoints submitted to aggregator listing forms:
 *
 *   public/api/supply/{total,circulating}/index.html  → <decimal>
 *   public/api/supply/meta.json
 *
 * Each endpoint body is one bare decimal in whole token units and nothing
 * else: CoinMarketCap requires a numerical value only, matching its cited
 * example (chainz.cryptoid.info/grs/api.dws?q=totalcoins →
 * 90671648.88736623). This is the only token the API serves — REPv1,
 * REPv2, and REPv2_No_1 are deliberately not published.
 *
 * The bare number is a directory index so its URL carries no file
 * extension: GitHub Pages infers Content-Type from the extension and gives
 * no header control, so a plain extensionless file is typed
 * application/octet-stream and browsers download it instead of showing it.
 * Backing the same URL with index.html yields text/html, which renders.
 *
 * Circulating equals total: no locked, reserved, or treasury allocations.
 *
 * meta.json carries provenance (block number, generation time) and the
 * exact wei value as a string, so all 18 decimals survive JSON transport —
 * read as a JSON number the value would round near the 17th significant
 * digit.
 *
 * Fail-closed: nothing is written unless the token passes identity checks
 * (on-chain symbol and decimals) and sanity bounds. On failure the script
 * exits non-zero, CI skips the deploy, and the previously deployed values
 * remain live.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ethers } from "ethers";

// Public RPC endpoints (no API keys required!)
// ETH_RPC_URL env var is prepended as primary when set
const PUBLIC_RPC_ENDPOINTS = [
	...(process.env.ETH_RPC_URL ? [process.env.ETH_RPC_URL] : []),
	"https://ethereum-rpc.publicnode.com", // PublicNode (Allnodes)
	"https://eth.drpc.org", // dRPC
	"https://1rpc.io/eth", // 1RPC (Automata)
];

const ERC20_ABI = [
	"function totalSupply() view returns (uint256)",
	"function symbol() view returns (string)",
	"function decimals() view returns (uint8)",
];

// The one published REP identity, verified in docs/moon-fork-final-record.md.
// The on-chain symbol() must match exactly, guarding against a wrong address.
const TOKEN = {
	address: "0xCf6A0A7826fa124B7705d6f3c675eAD76f1e540D",
	expectedSymbol: "REPv2_Yes_1",
	/** Role of this identity, carried into meta.json for consumers */
	role: "Current REP, the token of the winning/canonical child universe of the Moon Fork.",
};

const EXPECTED_DECIMALS = 18;

// Short per-request timeout so one hung endpoint cannot eat the CI job
// budget before the remaining fallbacks get a chance (ethers defaults
// to 300s per request).
const RPC_REQUEST_TIMEOUT_MS = 30_000;

// Read a few blocks behind the tip: load-balanced public RPCs can route
// the pinned eth_call to a backend that has not seen the tip block yet,
// and the small lag also avoids reorg exposure.
const BLOCK_LAG = 5;

// REP genesis supply is 11,000,000, which no universe's token can exceed.
// Supply has been effectively fixed since the fork window closed on
// 2026-08-03; the only remaining mint path is forkAndRedeem on unredeemed
// forking-market bonds, so the genesis bound is the safe invariant.
const MAX_SUPPLY_WEI = 11_000_000n * 10n ** BigInt(EXPECTED_DECIMALS);

/**
 * Reject values that cannot be a real REP supply before anything is
 * published: zero, negative, or above the 11,000,000 genesis supply.
 */
function assertSaneSupplyWei(wei: bigint, label: string): void {
	if (wei <= 0n) {
		throw new Error(`${label}: supply ${wei} is not a positive value`);
	}
	if (wei > MAX_SUPPLY_WEI) {
		throw new Error(
			`${label}: supply ${wei} exceeds the 11,000,000 REP genesis bound`,
		);
	}
}

/**
 * Format a wei amount as a bare decimal string in whole token units:
 * no grouping separators, no exponent, no trailing zeros.
 */
function formatWholeTokens(wei: bigint, decimals: number): string {
	if (!Number.isInteger(decimals) || decimals < 0) {
		throw new Error(`Invalid decimals: ${decimals}`);
	}
	if (wei < 0n) {
		throw new Error(`Cannot format negative amount: ${wei}`);
	}
	const base = 10n ** BigInt(decimals);
	const whole = (wei / base).toString();
	const fraction = (wei % base)
		.toString()
		.padStart(decimals, "0")
		.replace(/0+$/u, "");
	return fraction.length > 0 ? `${whole}.${fraction}` : whole;
}

interface SupplySnapshot {
	blockNumber: number;
	symbol: string;
	totalSupplyWei: bigint;
	/** Whole-token decimal string served as the endpoints' body */
	formatted: string;
}

/**
 * Read the token at a pinned block, refusing to proceed unless the
 * on-chain identity matches the verified one.
 */
async function readTokenAtBlock(
	provider: ethers.JsonRpcProvider,
	blockNumber: number,
): Promise<SupplySnapshot> {
	const contract = new ethers.Contract(TOKEN.address, ERC20_ABI, provider);

	const symbol: string = await contract.symbol({ blockTag: blockNumber });
	if (symbol !== TOKEN.expectedSymbol) {
		throw new Error(
			`on-chain symbol "${symbol}" does not match expected "${TOKEN.expectedSymbol}" — refusing to publish`,
		);
	}

	const decimals = Number(await contract.decimals({ blockTag: blockNumber }));
	if (decimals !== EXPECTED_DECIMALS) {
		throw new Error(
			`${TOKEN.expectedSymbol}: on-chain decimals ${decimals} does not match expected ${EXPECTED_DECIMALS} — refusing to publish`,
		);
	}

	const totalSupplyWei: bigint = await contract.totalSupply({
		blockTag: blockNumber,
	});
	assertSaneSupplyWei(totalSupplyWei, TOKEN.expectedSymbol);

	return {
		blockNumber,
		symbol,
		totalSupplyWei,
		formatted: formatWholeTokens(totalSupplyWei, decimals),
	};
}

/**
 * Read the supply, trying each RPC endpoint in order until one succeeds.
 */
async function readSupplySnapshot(): Promise<SupplySnapshot> {
	let lastError: Error | null = null;
	let fallbacksAttempted = 0;

	for (const rpc of PUBLIC_RPC_ENDPOINTS) {
		try {
			console.log(`Attempting supply read with RPC: ${rpc}`);
			const startTime = Date.now();
			const request = new ethers.FetchRequest(rpc);
			request.timeout = RPC_REQUEST_TIMEOUT_MS;
			const provider = new ethers.JsonRpcProvider(request, "mainnet");

			const blockNumber = (await provider.getBlockNumber()) - BLOCK_LAG;
			console.log(`✓ Connected to: ${rpc} (${Date.now() - startTime}ms)`);

			if (fallbacksAttempted > 0) {
				console.log(
					`::warning::Using RPC fallback endpoint (${fallbacksAttempted} previous failures)`,
				);
			}

			const snapshot = await readTokenAtBlock(provider, blockNumber);
			console.log(
				`✓ ${snapshot.symbol} totalSupply at block ${blockNumber}: ${snapshot.formatted}`,
			);
			return snapshot;
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			console.log(`✗ Supply read failed with ${rpc}: ${lastError.message}`);
			fallbacksAttempted++;
		}
	}

	const errorMsg = `All RPC endpoints failed (attempted ${fallbacksAttempted})`;
	console.log(`::error::${errorMsg}`);
	throw lastError || new Error(errorMsg);
}

async function writeSupplyFiles(snapshot: SupplySnapshot): Promise<void> {
	const outputDir = path.resolve(
		import.meta.dirname,
		"..",
		"public",
		"api",
		"supply",
	);

	// Rebuild from scratch so a layout change cannot strand orphaned files
	// from an earlier version, and so a path that used to be a file can
	// become a directory. Safe for fail-closed: the chain read has already
	// succeeded by the time this runs.
	await fs.rm(outputDir, { recursive: true, force: true });
	await fs.mkdir(outputDir, { recursive: true });

	// Circulating equals total: no locked, reserved, or treasury allocations,
	// so both fields serve the same value.
	//
	// {field}/index.html carries the bare number CoinMarketCap asks for, with
	// no trailing newline and no markup, so the body is nothing but the
	// value. It is deliberately not valid HTML — any tag would break
	// "numerical value only", and a browser renders the bare text either way.
	for (const field of ["total", "circulating"]) {
		await fs.mkdir(path.join(outputDir, field), { recursive: true });
		await fs.writeFile(
			path.join(outputDir, field, "index.html"),
			snapshot.formatted,
		);
	}

	const meta = {
		generatedAt: new Date().toISOString(),
		blockNumber: snapshot.blockNumber,
		note: "Circulating equals total: no locked, reserved, or treasury allocations.",
		token: {
			address: TOKEN.address,
			symbol: snapshot.symbol,
			role: TOKEN.role,
			totalSupplyWei: snapshot.totalSupplyWei.toString(),
			totalSupply: snapshot.formatted,
			circulatingSupply: snapshot.formatted,
		},
	};
	await fs.writeFile(
		path.join(outputDir, "meta.json"),
		`${JSON.stringify(meta, null, "\t")}\n`,
	);

	console.log(`✓ Supply endpoints written to ${outputDir}`);
}

async function main(): Promise<void> {
	try {
		const snapshot = await readSupplySnapshot();
		await writeSupplyFiles(snapshot);
		process.exit(0);
	} catch (error) {
		console.error("\n✗ Fatal error during supply endpoint generation:");
		console.error(
			`Error: ${error instanceof Error ? error.message : String(error)}`,
		);
		process.exit(1);
	}
}

// Run if called directly (TypeScript/Node compatible)
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	main();
}
