import assert from "node:assert/strict";
import test from "node:test";
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
			},
			{
				index: 1,
				label: "Yes",
				childUniverse: winningChild,
				migratedRep: 600,
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

test("rejects a record with missing outcome data without throwing", () => {
	const data = baseData();
	assert.ok(data.fork);
	data.fork.outcomes = undefined as never;

	const validation = validateForkRiskData(data);
	assert.equal(validation.valid, false);
	assert.match(validation.errors.join("\n"), /outcomes must be an array/u);
});
