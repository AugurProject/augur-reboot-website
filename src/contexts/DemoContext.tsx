import type React from 'react'
import {
	createContext,
	useContext,
	useState,
	useCallback,
} from 'react'
import { useForkRisk } from './ForkRiskContext'
import { generateDemoForkRiskData, DisputeBondScenario } from '../utils/demoDataGenerator'
import type { ForkRiskData } from '../types/gauge'

interface DemoContextValue {
	isDemo: boolean
	isDemoAvailable: boolean
	generateRisk: (percentage: number) => void
	generateScenario: (scenario: DisputeBondScenario) => void
	setDemoData: (data: ForkRiskData) => void
	resetToLive: () => void
}

const DemoContext = createContext<DemoContextValue | undefined>(undefined)

interface DemoProviderProps {
	children: React.ReactNode
}

export const DemoProvider = ({ children }: DemoProviderProps): React.JSX.Element => {
	const [isDemo, setIsDemo] = useState(false)
	const { setData } = useForkRisk()
	
	// Demo is only available in development mode
	const isDemoAvailable = !import.meta.env.PROD

	const generateRisk = useCallback((percentage: number) => {
		if (!isDemoAvailable) return
		
		const generatedData = generateDemoForkRiskData(DisputeBondScenario.LOW_RISK) // Legacy fallback
		setData(generatedData)
		setIsDemo(true)
	}, [setData, isDemoAvailable])
	
	const generateScenario = useCallback((scenario: DisputeBondScenario) => {
		if (!isDemoAvailable) return
		
		const generatedData = generateDemoForkRiskData(scenario)
		setData(generatedData)
		setIsDemo(true)
	}, [setData, isDemoAvailable])
	
	const setDemoData = useCallback((data: ForkRiskData) => {
		if (!isDemoAvailable) return
		
		setData(data)
		setIsDemo(true)
	}, [setData, isDemoAvailable])

	const resetToLive = useCallback(async () => {
		try {
			// Fetch fresh live data from JSON file
			const baseUrl = import.meta.env.BASE_URL || '/'
			const dataUrl = baseUrl.endsWith('/') ? `${baseUrl}data/fork-risk.json` : `${baseUrl}/data/fork-risk.json`
			const response = await fetch(dataUrl)
			if (!response.ok) {
				throw new Error(`Failed to load live data: ${response.status}`)
			}
			const liveData = await response.json() as ForkRiskData
			setData(liveData)
			setIsDemo(false)
		} catch (err) {
			console.error('Error loading live fork risk data:', err)
			// If we can't load live data, just mark as not demo
			// The context will handle fallback to default data
			setIsDemo(false)
		}
	}, [setData])

	const contextValue: DemoContextValue = {
		isDemo,
		isDemoAvailable,
		generateRisk,
		generateScenario,
		setDemoData,
		resetToLive,
	}

	return (
		<DemoContext.Provider value={contextValue}>
			{children}
		</DemoContext.Provider>
	)
}

export const useDemo = (): DemoContextValue => {
	const context = useContext(DemoContext)
	if (!context) {
		throw new Error('useDemo must be used within a DemoProvider')
	}
	return context
}