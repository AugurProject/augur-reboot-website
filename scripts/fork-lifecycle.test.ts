import assert from "node:assert/strict";
import test from "node:test";
import {
	classifyForkRecordAtObservedTime,
	readForkLifecycleSignals,
	readObservedBlockTimestamp,
	selectForkDataMode,
} from "./calculate-fork-risk.ts";
import {
	deriveForkLifecycle,
	getForkRecord,
} from "../src/features/fork-monitor/derive-fork-lifecycle.ts";
import type { ForkRiskData } from "../src/features/fork-monitor/types.ts";
import { validateForkRiskData } from "../src/features/fork-monitor/validate-fork-data.ts";

const parentUniverse = "0x1111111111111111111111111111111111111111";
const market = "0x2222222222222222222222222222222222222222";
const winningChild = "0x3333333333333333333333333333333333333333";
const otherChild = "0x4444444444444444444444444444444444444444";

test("keeps a successful pre-fork zero deadline as ordinary monitoring", async () => {
	const signals = await readForkLifecycleSignals({
		isForking: async () => false,
		getForkEndTime: async () => 0n,
	});

	assert.deepEqual(signals, { isForking: false, forkEndTime: 0 });
	assert.equal(selectForkDataMode(signals, 2000), "monitoring");
});

test("uses observed block time when selecting post-deadline preservation", async () => {
	const signals = await readForkLifecycleSignals({
		isForking: async () => false,
		getForkEndTime: async () => 2000n,
	});
	const processWallTime = 2001;

	assert.ok(processWallTime >= 2000);
	assert.equal(selectForkDataMode(signals, 1999), "monitoring");
	assert.equal(selectForkDataMode(signals, 2000), "post-deadline-record");
});

test("fails closed when the observed block cannot be read", async () => {
	await assert.rejects(
		readObservedBlockTimestamp(async () => null, 100),
		/Observed block 100 could not be read/u,
	);
});

test("does not guess when the forking status read fails", async () => {
	await assert.rejects(
		readForkLifecycleSignals({
			isForking: async () => {
				throw new Error("RPC unavailable");
			},
			getForkEndTime: async () => 0n,
		}),
		/RPC unavailable/u,
	);
});

test("does not guess when the fork deadline read fails", async () => {
	await assert.rejects(
		readForkLifecycleSignals({
			isForking: async () => false,
			getForkEndTime: async () => {
				throw new Error("RPC unavailable");
			},
		}),
		/RPC unavailable/u,
	);
});

const baseData = (
	winningChildUniverse: string | null = null,
): ForkRiskData => ({
	schemaVersion: 2,
	generatedAt: "2026-08-02T00:00:00.000Z",
	lastRiskChange: "2026-08-02T00:00:00.000Z",
	blockNumber: 100,
	riskLevel: "critical",
	riskPercentage: 100,
	metrics: {
		largestDisputeBond: 275000,
		forkThresholdPercent: 100,
		activeDisputes: 0,
		currentRound: 99,
		estimatedTotalRounds: null,
		roundProgress: 100,
		disputeDetails: [],
	},
	calculation: { forkThreshold: 275000 },
	fork: {
		status: "migration-open",
		parentUniverse,
		forkingMarket: market,
		migrationDeadline: 2000,
		reputationGoal: 500,
		winningChildUniverse,
		outcomes: [
			{
				index: 0,
				label: "No",
				childUniverse: otherChild,
				migratedRep: 100,
				migratedRepWei: "100000000000000000000",
			},
			{
				index: 1,
				label: "Yes",
				childUniverse: winningChild,
				migratedRep: 600,
				migratedRepWei: "600000000000000000000",
			},
		],
	},
});

test("derives monitoring when no fork record exists", () => {
	const data = baseData();
	delete data.fork;

	assert.equal(deriveForkLifecycle(data, 1000).state, "monitoring");
});

test("keeps the migration-open state unresolved without a winner", () => {
	assert.equal(deriveForkLifecycle(baseData(), 1000).state, "migration-open");
});

test("distinguishes a known winner while migration remains open", () => {
	const data = baseData(winningChild);
	assert.equal(
		deriveForkLifecycle(data, 1000).state,
		"migration-open-resolved",
	);
	assert.equal(deriveForkLifecycle(data, 1000).winnerKnown, true);
});

test("moves to a resolved Fork Record exactly at the deadline", () => {
	const data = baseData(winningChild);
	assert.equal(
		deriveForkLifecycle(data, 2000).state,
		"migration-closed-resolved",
	);
});

test("classifies the generated record from observed block time, not generatedAt", () => {
	const data = baseData(winningChild);
	assert.ok(Date.parse(data.generatedAt ?? "") / 1000 > 2000);

	assert.equal(
		classifyForkRecordAtObservedTime(data, 1999),
		"migration-open-resolved",
	);
	assert.equal(
		classifyForkRecordAtObservedTime(data, 2000),
		"migration-closed-resolved",
	);
});

test("keeps the migration CTA state one second before the deadline", () => {
	const data = baseData(winningChild);
	assert.equal(
		deriveForkLifecycle(data, 1999).state,
		"migration-open-resolved",
	);
});

test("moves to pending verification after the deadline without a winner", () => {
	assert.equal(
		deriveForkLifecycle(baseData(), 2001).state,
		"migration-closed-unverified",
	);
});

test("rejects a resolved record whose winner is not an emitted outcome", () => {
	const data = baseData(winningChild);
	assert.ok(data.fork);
	data.fork.status = "migration-closed-resolved";
	data.fork.winningChildUniverse = "0x5555555555555555555555555555555555555555";

	const validation = validateForkRiskData(data);
	assert.equal(validation.valid, false);
	assert.match(validation.errors.join("\n"), /does not match/u);
});

test("accepts a valid schema v2 resolved record", () => {
	const data = baseData(winningChild);
	assert.ok(data.fork);
	data.fork.status = "migration-closed-resolved";

	assert.equal(validateForkRiskData(data).valid, true);
	assert.equal(getForkRecord(data)?.winningChildUniverse, winningChild);
});

test("keeps the legacy forkActive shape while schema v2 carries exact totals", () => {
	const data = baseData(winningChild);
	assert.ok(data.fork);
	const compatibilityOutcomes = data.fork.outcomes.map((outcome) => {
		const compatibilityOutcome = { ...outcome };
		delete compatibilityOutcome.migratedRepWei;
		return compatibilityOutcome;
	});
	data.forkActive = {
		forkingMarket: data.fork.forkingMarket,
		forkEndTime: data.fork.migrationDeadline,
		winningChildUniverse: data.fork.winningChildUniverse,
		forkReputationGoal: data.fork.reputationGoal,
		universeRepSupply: 1000,
		outcomes: compatibilityOutcomes,
	};

	assert.equal(
		data.fork.outcomes[1].migratedRepWei,
		"600000000000000000000",
	);
	assert.equal(data.forkActive.outcomes[1].migratedRepWei, undefined);
	delete data.fork;

	const validation = validateForkRiskData(data);
	const lifecycle = deriveForkLifecycle(data, 2000);

	assert.equal(validation.valid, true);
	assert.equal(lifecycle.state, "migration-closed-resolved");
	assert.equal(data.riskLevel, "critical");
	assert.equal(data.riskPercentage, 100);
	assert.equal(data.forkActive.forkEndTime, 2000);
	assert.equal(lifecycle.record?.outcomes[1].migratedRep, 600);
});

test("rejects a record with missing outcome data without throwing", () => {
	const data = baseData();
	assert.ok(data.fork);
	data.fork.outcomes = undefined as never;

	const validation = validateForkRiskData(data);
	assert.equal(validation.valid, false);
	assert.match(validation.errors.join("\n"), /outcomes must be an array/u);
});
