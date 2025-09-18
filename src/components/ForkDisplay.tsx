import React, { useState, useEffect } from 'react'
import { ForkGauge } from './ForkGauge'
import { ForkStats } from './ForkStats'
import { ForkControls } from './ForkControls'
import { useForkData } from '../providers/ForkDataProvider'
import { $appStore, UIState } from '../stores/animationStore'

interface ForkDisplayProps {
  // Keep props for compatibility, but will use real data
  animated?: boolean
}

const ForkDisplay: React.FC<ForkDisplayProps> = ({
  animated = true,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  
  // Use the fork risk hook to get real data
  const { gaugeData, riskLevel, lastUpdated, isLoading, error } = useForkData()

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
  if (!isVisible) return null

  return (
    <>
      <div className="w-full text-center py-8">
        {isLoading && <div className="mb-4 text-muted-foreground">Loading fork risk data...</div>}

        {error && <div className="mb-4 text-orange-400">Warning: {error}</div>}

        <ForkGauge percentage={gaugeData.percentage} />

        <ForkStats riskLevel={riskLevel} repStaked={gaugeData.repStaked} activeDisputes={gaugeData.activeDisputes} />

        <div className="text-sm font-light tracking-[0.05em] uppercase text-muted-foreground">
          Last updated: <span>{lastUpdated}</span>
        </div>
      </div>
      
      {/* Demo overlay - only visible in development */}
      <ForkControls />
    </>
  )
}

export default ForkDisplay;
