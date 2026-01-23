export interface GaugeData {
	percentage: number
	repStaked: number
	activeDisputes: number
}

export interface RiskLevel {
	level: 'No Risk' | 'Low' | 'Moderate' | 'High' | 'Critical'
}

export interface ForkRiskData {
	lastRiskChange: string
	blockNumber?: number
	riskLevel: 'none' | 'low' | 'moderate' | 'high' | 'critical' | 'unknown'
	riskPercentage: number
	metrics: {
		largestDisputeBond: number
		forkThresholdPercent: number
		activeDisputes: number
		disputeDetails: Array<{
			marketId: string
			title: string
			disputeBondSize: number
			disputeRound: number
			daysRemaining: number
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
	onPercentageChange?: (percentage: number) => void
}

export interface DataPanelsProps {
	riskLevel: RiskLevel
	repStaked: number
	activeDisputes: number
}