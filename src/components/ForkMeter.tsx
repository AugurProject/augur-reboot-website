import React, { useState, useEffect } from 'react'
import { GaugeDisplay } from './GaugeDisplay'
import { DataPanels } from './DataPanels'
import { DemoOverlay } from './DemoOverlay'
import { useForkRisk } from '../contexts/ForkRiskContext'
import { $appStore, UIState } from '../stores/animationStore'

interface ForkMeterProps {
  // Keep props for compatibility, but will use real data
  animated?: boolean
}

const ForkMeter: React.FC<ForkMeterProps> = ({
  animated = true,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  
  // Use the fork risk hook to get real data
  const {
    gaugeData,
    riskLevel,
    lastUpdated,
    isLoading,
    error,
  } = useForkRisk()

  // Subscribe to animation state
  useEffect(() => {
    const unsubscribe = $appStore.subscribe((state) => {
      const shouldShow = state.uiState === UIState.MAIN_CONTENT
      setIsVisible(shouldShow)
    })

    // Initialize with current state
    const currentState = $appStore.get()
    const shouldShow = currentState.uiState === UIState.MAIN_CONTENT
    setIsVisible(shouldShow)

    return unsubscribe
  }, [])

  // Don't render anything until animation state allows it
  if (!isVisible) {
    return null
  }

  return (
    <>
      <div className="max-w-4xl w-full text-center">
        {isLoading && <div className="mb-4 text-muted-foreground">Loading fork risk data...</div>}

        {error && <div className="mb-4 text-orange-400">Warning: {error}</div>}

        <GaugeDisplay percentage={gaugeData.percentage} />

        <DataPanels
          riskLevel={riskLevel}
          repStaked={gaugeData.repStaked}
          activeDisputes={gaugeData.activeDisputes}
        />

        <div className="text-sm font-light tracking-[0.05em] uppercase text-muted-foreground">
          Last updated: <span className="text-primary">{lastUpdated}</span>
        </div>
      </div>
      
      {/* Demo overlay - only visible in development */}
      <DemoOverlay />
    </>
  )
}

export default ForkMeter;