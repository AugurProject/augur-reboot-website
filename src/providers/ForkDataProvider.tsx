import type React from 'react'
import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from 'react'
import type { ForkRiskData, GaugeData, RiskLevel } from '../types/gauge'

interface ForkDataContextValue {
	gaugeData: GaugeData
	riskLevel: RiskLevel
	lastUpdated: string
	isLoading: boolean
	error?: string
	rawData: ForkRiskData
	setData: (data: ForkRiskData) => void
	refetch: () => void
}

const ForkDataContext = createContext<ForkDataContextValue | undefined>(
	undefined,
)

interface ForkDataProviderProps {
	children: React.ReactNode
	updateInterval?: number // in milliseconds, defaults to 5 minutes
}

export const ForkDataProvider = ({
	children,
	updateInterval = 5 * 60 * 1000, // 5 minutes default
}: ForkDataProviderProps): React.JSX.Element => {
	// Create stable default data that doesn't change between renders
	const [defaultData] = useState<ForkRiskData>(() => ({
		timestamp: new Date().toISOString(),
		blockNumber: 0,
		riskLevel: 'unknown',
		riskPercentage: 0,
		metrics: {
			largestDisputeBond: 0,
			forkThresholdPercent: 0,
			activeDisputes: 0,
			disputeDetails: [],
		},
		nextUpdate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
		calculation: {
			method: 'Static fallback',
			forkThreshold: 275000,
		},
	}))

	const [forkRiskData, setForkRiskData] = useState<ForkRiskData | null>(null)
	const [isLoading, setIsLoading] = useState(false) // Start as false to prevent hydration mismatch
	const [error, setError] = useState<string>()
	const [hasHydrated, setHasHydrated] = useState(false)

	const loadForkRiskData = useCallback(async () => {
		try {
			setIsLoading(true)
			setError(undefined)

			// Try to load from static JSON file first
			const baseUrl = import.meta.env.BASE_URL || '/'
			const dataUrl = baseUrl.endsWith('/') ? `${baseUrl}data/fork-risk.json` : `${baseUrl}/data/fork-risk.json`
			const response = await fetch(dataUrl)

			if (!response.ok) {
				throw new Error(`Failed to load fork risk data: ${response.status}`)
			}

			const data: ForkRiskData = await response.json()
			setForkRiskData(data)
		} catch (err) {
			console.error('Error loading fork risk data:', err)
			setError(err instanceof Error ? err.message : 'Failed to load data')

			// Fallback to default data if file doesn't exist
			setForkRiskData(defaultData)
		} finally {
			setIsLoading(false)
		}
	}, [defaultData])

	// Handle hydration
	useEffect(() => {
		setHasHydrated(true)
	}, [])

	// Load data on mount and set up refresh interval
	useEffect(() => {
		if (hasHydrated) {
			loadForkRiskData()

			// Refresh at the specified interval (data updates hourly, so 5min default is reasonable)
			const interval = setInterval(loadForkRiskData, updateInterval)
			return () => clearInterval(interval)
		}
	}, [loadForkRiskData, updateInterval, hasHydrated, defaultData])

	const convertToGaugeData = (data: ForkRiskData): GaugeData => ({
		percentage: data.riskPercentage, // Pass actual percentage, let GaugeDisplay handle visual scaling
		repStaked: data.metrics.largestDisputeBond,
		activeDisputes: data.metrics.activeDisputes,
	})

	const convertToRiskLevel = (data: ForkRiskData): RiskLevel => {
		let level: RiskLevel['level']

		switch (data.riskLevel) {
			case 'low':
				level = 'Low'
				break
			case 'moderate':
				level = 'Medium'
				break
			case 'high':
				level = 'High'
				break
			case 'critical':
				level = 'Critical'
				break
			default:
				level = 'Low'
		}

		return { level }
	}

	const formatLastUpdated = (data: ForkRiskData): string => {
		try {
			return new Date(data.timestamp).toLocaleString()
		} catch {
			return 'Unknown'
		}
	}

	const currentData = forkRiskData || defaultData

	// Allow external updates to the data (for demo usage)
	const updateData = useCallback((data: ForkRiskData) => {
		setForkRiskData(data)
	}, [])

	const contextValue: ForkDataContextValue = {
		gaugeData: convertToGaugeData(currentData),
		riskLevel: convertToRiskLevel(currentData),
		lastUpdated: formatLastUpdated(currentData),
		isLoading,
		error: error || currentData.error,
		rawData: currentData,
		setData: updateData,
		refetch: loadForkRiskData,
	}

	return (
		<ForkDataContext.Provider value={contextValue}>
			{children}
		</ForkDataContext.Provider>
	)
}

export const useForkData = (): ForkDataContextValue => {
	const context = useContext(ForkDataContext)

	if (!context) {
		throw new Error('useForkData must be used within a ForkDataProvider')
	}

	return context
}