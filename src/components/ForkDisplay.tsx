import type React from 'react'
import { useState, useEffect } from 'react'
import { ForkGauge } from './ForkGauge'
import { ForkStats } from './ForkStats'
import { ForkControls } from './ForkControls'
import { ForkDetailsCard } from './ForkDetailsCard'
import { useForkData } from '../providers/ForkDataProvider'
import { $appStore, UIState } from '../stores/animationStore'

const ForkDisplay: React.FC = () => {
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

        {/* Gauge with Details Card - ForkDetailsCard wraps the gauge */}
        <ForkDetailsCard gauge={<ForkGauge percentage={gaugeData.percentage} />} />

        <ForkStats riskLevel={riskLevel} repStaked={gaugeData.repStaked} activeDisputes={gaugeData.activeDisputes} />

        <div className="text-center text-sm text-gray-400">
          <span>Monitored: Every hour</span>
          <button
            type="button"
            className="ml-2 inline-block cursor-help text-xs underline hover:text-gray-300"
            title={`Last changed: ${formatRelativeTime(lastUpdated)}`}
          >
            ℹ️
          </button>
        </div>
      </div>

      {/* Demo overlay - only visible in development */}
      <ForkControls />
    </>
  )
}

function formatRelativeTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`

  return date.toLocaleDateString()
}

export default ForkDisplay;
