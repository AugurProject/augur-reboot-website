import type React from 'react'
import { useState, useEffect } from 'react'
import { ForkGauge } from './ForkGauge'
import { ForkStats } from './ForkStats'
import { ForkControls } from './ForkControls'
import { ForkDetailsCard } from './ForkDetailsCard'
import { useForkData } from '../providers/ForkDataProvider'
import { $appStore, UIState } from '../stores/animationStore'
import { cn } from '@/lib/utils'

// Helper function to format timestamps as relative time
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

        <button
          type="button"
          className="cursor-help italic text-center text-xs text-muted-foreground hover:underline hover:text-foreground focus:underline focus:text-foreground underline-offset-2 outline-none"
          title={`Last changed: ${formatRelativeTime(lastUpdated)}`}
        >
          <span>* levels are monitored hourly</span>
        </button>
      </div>

      {/* Demo overlay - only visible in development */}
      <ForkControls />
    </>
  )
}

export default ForkDisplay
