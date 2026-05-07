export interface GaugeData {
	percentage: number
	repStaked: number
	activeDisputes: number
}

export interface RiskLevel {
	level: 'No Risk' | 'Low' | 'Moderate' | 'High' | 'Critical' | 'Unknown'
}

export interface ForkRiskData {
	lastRiskChange: string
	blockNumber?: number
	riskLevel: 'none' | 'low' | 'moderate' | 'high' | 'critical' | 'unknown'
	riskPercentage: number | null
	metrics: {
		largestDisputeBond: number
		forkThresholdPercent: number
		activeDisputes: number
		currentRound: number
		estimatedTotalRounds: number | null
		roundProgress: number | null
		disputeDetails: Array<{
			marketId: string
			title: string
			disputeBondSize: number
			disputeRound: number
			estimatedTotalRounds: number | null
			roundProgress: number | null
			weeksRemaining: number
		}>
	}
	rpcInfo?: {
		endpoint: string | null
		latency: number | null
		fallbacksAttempted: number
	}
	calculation: {
		forkThreshold: number
	}
	cacheValidation?: {
		isHealthy: boolean
		discrepancy?: string
	}
	error?: string
}

export interface GaugeDisplayProps {
	percentage: number
	riskLevel?: string
	onPercentageChange?: (percentage: number) => void
}

export interface DataPanelsProps {
	riskLevel: RiskLevel
	repStaked: number
	activeDisputes: number
}