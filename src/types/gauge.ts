export interface GaugeData {
	percentage: number
	repStaked: number
	activeDisputes: number
}

export interface RiskLevel {
	level: 'Normal' | 'Low' | 'Moderate' | 'High' | 'Elevated'
}

export interface ForkRiskData {
	timestamp: string
	blockNumber?: number
	riskLevel: 'normal' | 'low' | 'moderate' | 'high' | 'elevated' | 'unknown'
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
	nextUpdate: string
	rpcInfo?: {
		endpoint: string | null
		latency: number | null
		fallbacksAttempted: number
		isPublicRpc?: boolean
	}
	calculation: {
		method: string
		forkThreshold: number
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