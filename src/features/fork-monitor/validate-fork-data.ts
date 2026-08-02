import {
	isEthereumAddress,
	isNonZeroEthereumAddress,
} from "./derive-fork-lifecycle.ts";
import type {
	ForkLifecycleState,
	ForkRecordData,
	ForkRiskData,
} from "./types.ts";

const LIFECYCLE_STATES = new Set<ForkLifecycleState>([
	"monitoring",
	"migration-open",
	"migration-open-resolved",
	"migration-closed-resolved",
	"migration-closed-unverified",
	"data-unavailable",
]);

export interface ForkDataValidationResult {
	valid: boolean;
	errors: string[];
}

const validateRecord = (record: ForkRecordData, errors: string[]): void => {
	if (!LIFECYCLE_STATES.has(record.status)) {
		errors.push(`Unknown fork lifecycle status: ${record.status}`);
	}

	if (!isEthereumAddress(record.forkingMarket)) {
		errors.push("Forking market is not a valid Ethereum address.");
	}

	if (
		record.parentUniverse !== null &&
		!isEthereumAddress(record.parentUniverse)
	) {
		errors.push("Parent universe is not a valid Ethereum address.");
	}

	if (
		!Number.isFinite(record.migrationDeadline) ||
		record.migrationDeadline <= 0
	) {
		errors.push("Migration deadline is missing or invalid.");
	}

	if (!Number.isFinite(record.reputationGoal) || record.reputationGoal < 0) {
		errors.push("Fork reputation goal is missing or invalid.");
	}

	if (!Array.isArray(record.outcomes)) {
		errors.push("Fork outcomes must be an array.");
		return;
	}

	const childAddresses = record.outcomes
		.map((outcome) => outcome.childUniverse)
		.filter(isNonZeroEthereumAddress)
		.map((address) => address.toLowerCase());
	if (new Set(childAddresses).size !== childAddresses.length) {
		errors.push("Duplicate child universe addresses were emitted.");
	}

	for (const outcome of record.outcomes) {
		if (
			outcome.childUniverse !== null &&
			!isEthereumAddress(outcome.childUniverse)
		) {
			errors.push(`Outcome ${outcome.index} has an invalid child universe.`);
		}
		if (!Number.isFinite(outcome.migratedRep) || outcome.migratedRep < 0) {
			errors.push(`Outcome ${outcome.index} has invalid migrated REP.`);
		}
	}

	if (
		record.winningChildUniverse !== null &&
		!isEthereumAddress(record.winningChildUniverse)
	) {
		errors.push("Winning child universe is not a valid Ethereum address.");
	}

	const winner = record.winningChildUniverse?.toLowerCase();
	const winnerMatchesOutcome = winner
		? record.outcomes.some(
				(outcome) => outcome.childUniverse?.toLowerCase() === winner,
			)
		: false;
	if (winner && !winnerMatchesOutcome) {
		errors.push("Winning child universe does not match an emitted outcome.");
	}

	const winnerRequired =
		record.status === "migration-open-resolved" ||
		record.status === "migration-closed-resolved";
	if (winnerRequired && !winnerMatchesOutcome) {
		errors.push(
			`${record.status} requires a winning child universe that matches an outcome.`,
		);
	}
	if (record.status === "migration-closed-unverified" && winnerMatchesOutcome) {
		errors.push(
			"migration-closed-unverified cannot include a verified winning child universe.",
		);
	}
};

export const validateForkRiskData = (
	data: ForkRiskData,
): ForkDataValidationResult => {
	const errors: string[] = [];

	if (data.fork) validateRecord(data.fork, errors);

	if (data.forkActive) {
		if (!Array.isArray(data.forkActive.outcomes)) {
			errors.push("Legacy forkActive outcomes must be an array.");
			return { valid: false, errors };
		}

		for (const outcome of data.forkActive.outcomes) {
			if (
				outcome.childUniverse !== null &&
				!isEthereumAddress(outcome.childUniverse)
			) {
				errors.push(`Legacy outcome ${outcome.index} has an invalid child universe.`);
			}
			if (!Number.isFinite(outcome.migratedRep) || outcome.migratedRep < 0) {
				errors.push(`Legacy outcome ${outcome.index} has invalid migrated REP.`);
			}
		}

		if (
			!Number.isFinite(data.forkActive.forkEndTime) ||
			data.forkActive.forkEndTime <= 0
		) {
			errors.push("Legacy forkActive deadline is missing or invalid.");
		}

		const winner = data.forkActive.winningChildUniverse;
		if (winner !== undefined && winner !== null) {
			if (!isEthereumAddress(winner)) {
				errors.push("Legacy winning child universe is invalid.");
			} else if (
				!data.forkActive.outcomes.some(
					(outcome) =>
						outcome.childUniverse?.toLowerCase() === winner.toLowerCase(),
				)
			) {
				errors.push("Legacy winning child universe does not match an outcome.");
			}
		}
	}

	if (data.schemaVersion === 2) {
		if (!data.generatedAt || Number.isNaN(Date.parse(data.generatedAt))) {
			errors.push("Schema v2 data requires a valid generatedAt timestamp.");
		}
		if (!Number.isInteger(data.blockNumber) || (data.blockNumber ?? 0) <= 0) {
			errors.push("Schema v2 data requires an observed block number.");
		}
		if (data.fork === undefined && !data.forkActive) {
			errors.push("Schema v2 fork data requires a fork record.");
		}
	}

	return { valid: errors.length === 0, errors };
};
