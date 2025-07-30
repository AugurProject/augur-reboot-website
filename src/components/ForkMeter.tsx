import React, { useMemo } from 'react';
import ForkMeterUI, { type ForkMeterMetadata, ForkMeterState } from './ForkMeterUI.tsx';

interface ForkMeterProps {
  value?: number; // 0-100 for pointer position
  animated?: boolean;
  // Future: could add props for data source, refresh interval, etc.
}

const ForkMeter: React.FC<ForkMeterProps> = ({
  value = 75,
  animated = true,
}) => {
  // Generate stable timestamp once
  const timestamp = useMemo(() => new Date().toISOString(), []);
  
  // Generate metadata based on component props and state
  const metadata: ForkMeterMetadata = useMemo(() => {
    // For values > 60%, we need prediction data
    if (value > 60) {
      return {
        value,
        animated,
        last_updated: timestamp,
        prediction: "ETH WILL BE ABOVE $4,000 BY JULY, 2026",
        round: "RD 2",
        remaining_time: "120 HRS",
        staked: "REP 4,000,000",
      };
    }
    
    // For low values, just basic metadata
    return {
      value,
      animated,
      last_updated: timestamp,
    };
  }, [value, animated, timestamp]);

  return <ForkMeterUI metadata={metadata} />;
};

export default ForkMeter;