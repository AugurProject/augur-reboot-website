import type {
	ForkLifecycleState,
	ForkRecordData,
	ForkRiskData,
} from "./types.ts";

const ETHEREUM_ADDRESS = /^0x[0-9a-f]{40}$/iu;

export interface DerivedForkLifecycle {
	state: ForkLifecycleState;
	record: ForkRecordData | null;
	winnerKnown: boolean;
	deadlinePassed: boolean;
	reason?: string;
}

export const isEthereumAddress = (
	value: string | null | undefined,
): value is string => typeof value === "string" && ETHEREUM_ADDRESS.test(value);

export const isNonZeroEthereumAddress = (
	value: string | null | undefined,
): value is string =>
	isEthereumAddress(value) && !/^0x0{40}$/iu.test(value as string);

const legacyRecord = (data: ForkRiskData): ForkRecordData | null => {
	const fork = data.forkActive;
	if (!fork) return null;

	return {
		status: "migration-open",
		parentUniverse: null,
		forkingMarket: fork.forkingMarket,
		migrationDeadline: fork.forkEndTime,
		reputationGoal: fork.forkReputationGoal,
		winningChildUniverse: fork.winningChildUniverse ?? null,
		outcomes: fork.outcomes,
		observedBlock: data.blockNumber,
	};
};

export const getForkRecord = (data: ForkRiskData): ForkRecordData | null =>
	data.fork ?? legacyRecord(data);

export const deriveForkLifecycle = (
	data: ForkRiskData,
	nowSeconds = Math.floor(Date.now() / 1000),
): DerivedForkLifecycle => {
	if (data.error) {
		return {
			state: "data-unavailable",
			record: null,
			winnerKnown: false,
			deadlinePassed: false,
			reason: data.error,
		};
	}

	const record = getForkRecord(data);
	if (!record) {
		return {
			state: "monitoring",
			record: null,
			winnerKnown: false,
			deadlinePassed: false,
		};
	}

	if (
		!Number.isFinite(record.migrationDeadline) ||
		record.migrationDeadline <= 0
	) {
		return {
			state: "data-unavailable",
			record,
			winnerKnown: false,
			deadlinePassed: false,
			reason: "Migration deadline is missing or invalid.",
		};
	}

	const winnerKnown =
		Array.isArray(record.outcomes) &&
		isNonZeroEthereumAddress(record.winningChildUniverse) &&
		record.outcomes.some(
			(outcome) =>
				outcome.childUniverse?.toLowerCase() ===
				record.winningChildUniverse?.toLowerCase(),
		);
	const deadlinePassed = nowSeconds >= record.migrationDeadline;

	return {
		state: deadlinePassed
			? winnerKnown
				? "migration-closed-resolved"
				: "migration-closed-unverified"
			: winnerKnown
				? "migration-open-resolved"
				: "migration-open",
		record,
		winnerKnown,
		deadlinePassed,
	};
};
