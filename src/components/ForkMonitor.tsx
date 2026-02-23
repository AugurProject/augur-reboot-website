import type React from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { ForkDataProvider } from '../providers/ForkDataProvider'
import { ForkMockProvider } from '../providers/ForkMockProvider'
import ForkDisplay from './ForkDisplay'

interface ForkMonitorProps {
  animated?: boolean
}

export const ForkMonitor: React.FC<ForkMonitorProps> = ({ animated: _animated = true }) => {
  return (
    <ErrorBoundary fallback={<div className="text-muted-foreground text-sm">Gauge unavailable</div>}>
      <ForkDataProvider>
        <ForkMockProvider>
          <ForkDisplay />
        </ForkMockProvider>
      </ForkDataProvider>
    </ErrorBoundary>
  )
}

export default ForkMonitor
