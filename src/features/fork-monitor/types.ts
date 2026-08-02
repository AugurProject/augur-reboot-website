export interface GaugeData {
	percentage: number;
	repStaked: number;
	activeDisputes: number;
}

export interface RiskLevel {
	level: "No Risk" | "Low" | "Moderate" | "High" | "Critical" | "Unknown";
}

export type ForkLifecycleState =
	| "monitoring"
	| "migration-open"
	| "migration-open-resolved"
	| "migration-closed-resolved"
	| "migration-closed-unverified"
	| "data-unavailable";

export interface ForkOutcome {
	index: number;
	label: string;
	childUniverse: string | null;
	reputationToken?: string | null;
	migratedRep: number;
	isWinner?: boolean;
}

export interface ForkRecordData {
	status: ForkLifecycleState;
	parentUniverse: string | null;
	forkingMarket: string;
	migrationDeadline: number;
	reputationGoal: number;
	winningChildUniverse: string | null;
	outcomes: ForkOutcome[];
	observedBlock?: number;
}

export interface ForkRiskData {
	schemaVersion?: number;
	generatedAt?: string;
	lastRiskChange: string;
	blockNumber?: number;
	riskLevel: "none" | "low" | "moderate" | "high" | "critical" | "unknown";
	riskPercentage: number | null;
	metrics: {
		largestDisputeBond: number;
		forkThresholdPercent: number;
		activeDisputes: number;
		currentRound: number;
		estimatedTotalRounds: number | null;
		roundProgress: number | null;
		disputeDetails: Array<{
			marketId: string;
			title: string;
			disputeBondSize: number;
			disputeRound: number;
			estimatedTotalRounds: number | null;
			roundProgress: number | null;
			weeksRemaining: number;
		}>;
	};
	rpcInfo?: {
		endpoint: string | null;
		latency: number | null;
		fallbacksAttempted: number;
	};
	calculation: {
		forkThreshold: number;
	};
	cacheValidation?: {
		isHealthy: boolean;
		discrepancy?: string;
	};
	fork?: ForkRecordData | null;
	forkActive?: {
		forkingMarket: string;
		forkEndTime: number;
		winningChildUniverse?: string | null;
		forkReputationGoal: number;
		universeRepSupply: number;
		outcomes: ForkOutcome[];
	};
	error?: string;
}

export interface GaugeDisplayProps {
	percentage: number;
	riskLevel?: string;
	onPercentageChange?: (percentage: number) => void;
}

export interface DataPanelsProps {
	riskLevel: RiskLevel;
	repStaked: number;
	activeDisputes: number;
}
