import type React from 'react'
import { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useForkMock } from '../providers/ForkMockProvider'
import { DisputeBondScenario } from '../utils/demoDataGenerator'

export const ForkControls = (): React.JSX.Element | null => {
	const { isDemo, isDemoAvailable, generateScenario, resetToLive } = useForkMock()
	const [isVisible, setIsVisible] = useState(false)
	
	// Only show in development mode
	if (!isDemoAvailable) {
		return null
	}
	
	// Keyboard shortcut to toggle demo overlay (F2)
	useEffect(() => {
		const handleKeydown = (e: KeyboardEvent) => {
			if (e.key === 'F2') {
				e.preventDefault()
				setIsVisible(prev => !prev)
			}
		}
		
		window.addEventListener('keydown', handleKeydown)
		return () => window.removeEventListener('keydown', handleKeydown)
	}, [])
	
	if (!isVisible) {
		return ReactDOM.createPortal(
			<div className="fixed top-4 left-4 z-50 text-xs text-muted-foreground bg-background/90 px-2 py-1 rounded">
				DEV: F2 for demo
			</div>,
			document.body
		)
	}
	
	return ReactDOM.createPortal(
		<div className="fixed top-4 left-4 z-50 bg-background/95 border border-primary/30 p-4 rounded text-sm max-w-xs">
			<div className="flex justify-between items-center mb-3">
				<h3 className="text-primary font-bold">Demo Controls</h3>
				<button 
					onClick={() => setIsVisible(false)}
					className="text-muted-foreground hover:text-primary"
				>
					×
				</button>
			</div>
			
			{isDemo && (
				<div className="mb-3 p-2 bg-orange-900/20 border border-orange-500/30 rounded">
					<div className="text-orange-400 text-xs font-bold mb-1">DEMO MODE ACTIVE</div>
					<button
						onClick={resetToLive}
						className="text-xs bg-primary/20 hover:bg-primary/30 px-2 py-1 rounded"
					>
						Return to Live Data
					</button>
				</div>
			)}
			
			<div className="space-y-2">
				<div className="text-xs text-muted-foreground mb-2">Generate Scenarios:</div>
				
				<button
					onClick={() => generateScenario(DisputeBondScenario.NO_DISPUTES)}
					className="block w-full text-left text-xs bg-green-900/20 hover:bg-green-900/30 px-2 py-1 rounded"
				>
					No Disputes (Steady)
				</button>
				
				<button
					onClick={() => generateScenario(DisputeBondScenario.LOW_RISK)}
					className="block w-full text-left text-xs bg-yellow-900/20 hover:bg-yellow-900/30 px-2 py-1 rounded"
				>
					Low Risk (1-10%)
				</button>
				
				<button
					onClick={() => generateScenario(DisputeBondScenario.MODERATE_RISK)}
					className="block w-full text-left text-xs bg-orange-900/20 hover:bg-orange-900/30 px-2 py-1 rounded"
				>
					Moderate Risk (10-25%)
				</button>
				
				<button
					onClick={() => generateScenario(DisputeBondScenario.HIGH_RISK)}
					className="block w-full text-left text-xs bg-red-900/20 hover:bg-red-900/30 px-2 py-1 rounded"
				>
					High Risk (25-75%)
				</button>
				
				<button
					onClick={() => generateScenario(DisputeBondScenario.ELEVATED_RISK)}
					className="block w-full text-left text-xs bg-red-800/30 hover:bg-red-800/40 px-2 py-1 rounded animate-pulse"
				>
					Elevated Risk (75%+)
				</button>
			</div>
			
			<div className="mt-3 text-xs text-muted-foreground">
				Demo data shows different dispute bond scenarios for testing UI behavior.
			</div>
		</div>,
		document.body
	)
}