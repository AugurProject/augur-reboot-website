import React from 'react'
import { ForkDataProvider } from '../providers/ForkDataProvider'
import { ForkMockProvider } from '../providers/ForkMockProvider'
import ForkDisplay from './ForkDisplay'

interface ForkMonitorProps {
  animated?: boolean
}

export const ForkMonitor: React.FC<ForkMonitorProps> = ({ animated = true }) => {
  return (
    <ForkDataProvider>
      <ForkMockProvider>
        <ForkDisplay animated={animated} />
      </ForkMockProvider>
    </ForkDataProvider>
  )
}

export default ForkMonitor