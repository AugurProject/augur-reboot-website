import type { ForkRiskData } from '../types/gauge'

type ForkRiskLevel = ForkRiskData['riskLevel']

// Constants from the actual fork risk calculation
const FORK_THRESHOLD_REP = 275000 // 2.5% of 11 million REP

// Dispute bond scenarios aligned with risk levels
export enum DisputeBondScenario {
	NO_DISPUTES = 'no_disputes',
	LOW_RISK = 'low_risk',
	MODERATE_RISK = 'moderate_risk', 
	HIGH_RISK = 'high_risk',
	ELEVATED_RISK = 'elevated_risk'
}

// Representative round data per scenario
const SCENARIO_ROUNDS: Record<Exclude<DisputeBondScenario, DisputeBondScenario.NO_DISPUTES>, {
	currentRound: number
	estimatedTotalRounds: number
}> = {
	[DisputeBondScenario.LOW_RISK]: { currentRound: 3, estimatedTotalRounds: 12 },
	[DisputeBondScenario.MODERATE_RISK]: { currentRound: 7, estimatedTotalRounds: 12 },
	[DisputeBondScenario.HIGH_RISK]: { currentRound: 9, estimatedTotalRounds: 12 },
	[DisputeBondScenario.ELEVATED_RISK]: { currentRound: 11, estimatedTotalRounds: 12 },
}

/**
 * Generate realistic ForkRiskData based on dispute bond scenario
 * Only available in development mode
 */
export const generateDemoForkRiskData = (scenario: DisputeBondScenario): ForkRiskData => {
	// Only allow demo data generation in development
	if (import.meta.env.PROD) {
		throw new Error('Demo data generation is only available in development mode')
	}

	let largestDisputeBond: number
	let riskLevel: ForkRiskLevel
	let activeDisputes: number
	let currentRound = 0
	let estimatedTotalRounds: number | null = null
	
	// Generate dispute bond scenarios aligned with risk levels
	switch (scenario) {
		case DisputeBondScenario.NO_DISPUTES:
			largestDisputeBond = 0
			activeDisputes = 0
			break
			
		case DisputeBondScenario.LOW_RISK:
			largestDisputeBond = 1100 + Math.floor(Math.random() * 26400)
			activeDisputes = Math.floor(Math.random() * 3) + 1
			;({ currentRound, estimatedTotalRounds } = SCENARIO_ROUNDS[scenario])
			break
			
		case DisputeBondScenario.MODERATE_RISK:
			largestDisputeBond = 27500 + Math.floor(Math.random() * 41250)
			activeDisputes = Math.floor(Math.random() * 4) + 2
			;({ currentRound, estimatedTotalRounds } = SCENARIO_ROUNDS[scenario])
			break
			
		case DisputeBondScenario.HIGH_RISK:
			largestDisputeBond = 68750 + Math.floor(Math.random() * 137500)
			activeDisputes = Math.floor(Math.random() * 5) + 3
			;({ currentRound, estimatedTotalRounds } = SCENARIO_ROUNDS[scenario])
			break
			
		case DisputeBondScenario.ELEVATED_RISK:
			largestDisputeBond = 206250 + Math.floor(Math.random() * 63250)
			activeDisputes = Math.floor(Math.random() * 8) + 4
			;({ currentRound, estimatedTotalRounds } = SCENARIO_ROUNDS[scenario])
			break
	}

	// Generate dispute details based on the scenario
	let disputeDetails: Array<{
		marketId: string
		title: string
		disputeBondSize: number
		disputeRound: number
		estimatedTotalRounds: number | null
		roundProgress: number | null
		daysRemaining: number
	}>

	if (activeDisputes > 0) {
		disputeDetails = Array.from({ length: Math.min(activeDisputes, 5) }, (_, i) => ({
			marketId: `0x${Math.random().toString(16).substring(2, 42).padStart(40, '0')}`,
			title: getDemoMarketTitle(i),
			disputeBondSize: i === 0 ? largestDisputeBond : generateVariedBondSize(largestDisputeBond, scenario),
			disputeRound: i === 0 ? currentRound : Math.floor(Math.random() * 3) + 1,
			estimatedTotalRounds: i === 0 ? estimatedTotalRounds : null,
			roundProgress: null,
			daysRemaining: Math.floor(Math.random() * 6) + 1,
		}))
	} else {
		disputeDetails = []
	}

	const forkThresholdPercent = (largestDisputeBond / FORK_THRESHOLD_REP) * 100
	const roundProgress = activeDisputes > 0 && estimatedTotalRounds
		? Math.round((currentRound / estimatedTotalRounds) * 1000) / 10
		: activeDisputes > 0 ? null : 0

	// Determine risk level from round progress
	if (roundProgress === null) {
		riskLevel = 'unknown'
	} else if (roundProgress === 0) {
		riskLevel = 'none'
	} else if (roundProgress >= 75) {
		riskLevel = 'critical'
	} else if (roundProgress >= 50) {
		riskLevel = 'high'
	} else if (roundProgress >= 25) {
		riskLevel = 'moderate'
	} else {
		riskLevel = 'low'
	}

	return {
		lastRiskChange: new Date().toISOString(),
		blockNumber: Math.floor(Math.random() * 1000000) + 20000000,
		riskLevel,
		riskPercentage: roundProgress,
		metrics: {
			largestDisputeBond,
			forkThresholdPercent: Math.round(forkThresholdPercent * 100) / 100,
			activeDisputes,
			currentRound,
			estimatedTotalRounds,
			roundProgress,
			disputeDetails,
		},
		rpcInfo: {
			endpoint: 'Demo Mode - Dispute Bond Simulation',
			latency: Math.floor(Math.random() * 200) + 100,
			fallbacksAttempted: 0,
		},
		calculation: {
			forkThreshold: FORK_THRESHOLD_REP,
		},
	}
}

/**
 * Generate varied bond sizes for additional disputes based on the main scenario
 */
const generateVariedBondSize = (largestBond: number, scenario: DisputeBondScenario): number => {
	switch (scenario) {
		case DisputeBondScenario.LOW_RISK:
			return Math.floor(largestBond * (0.2 + Math.random() * 0.6))
		case DisputeBondScenario.MODERATE_RISK:
			return Math.floor(largestBond * (0.3 + Math.random() * 0.5))
		case DisputeBondScenario.HIGH_RISK:
			return Math.floor(largestBond * (0.4 + Math.random() * 0.4))
		case DisputeBondScenario.ELEVATED_RISK:
			return Math.floor(largestBond * (0.5 + Math.random() * 0.3))
		default:
			return Math.floor(largestBond * 0.5)
	}
}

/**
 * Generate demo market titles for disputes
 */
const getDemoMarketTitle = (index: number): string => {
	const titles = [
		'Will the S&P 500 close above 5000 on December 31, 2024?',
		'Will Bitcoin reach $100,000 USD by the end of 2024?',
		'Will there be a recession in the US in 2024?',
		'Will AI achieve AGI (Artificial General Intelligence) by 2025?',
		'Will Ethereum transition fully to Proof of Stake succeed without major issues?',
		'Will the next US Presidential election be decided by less than 1% margin?',
		'Will global CO2 levels exceed 425 ppm in 2024?',
		'Will any country ban Bitcoin mining completely in 2024?',
	]
	
	return titles[index % titles.length]
}

// Scenario generator functions (development only)
export const generateNoDisputesDemo = (): ForkRiskData => {
	return generateDemoForkRiskData(DisputeBondScenario.NO_DISPUTES)
}

export const generateLowRiskDemo = (): ForkRiskData => {
	return generateDemoForkRiskData(DisputeBondScenario.LOW_RISK)
}

export const generateModerateRiskDemo = (): ForkRiskData => {
	return generateDemoForkRiskData(DisputeBondScenario.MODERATE_RISK)
}

export const generateHighRiskDemo = (): ForkRiskData => {
	return generateDemoForkRiskData(DisputeBondScenario.HIGH_RISK)
}

export const generateElevatedRiskDemo = (): ForkRiskData => {
	return generateDemoForkRiskData(DisputeBondScenario.ELEVATED_RISK)
}
