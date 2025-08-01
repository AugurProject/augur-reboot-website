import React, { useMemo, useState, useEffect } from 'react';
import ForkMeterUI, { type ForkMeterMetadata, ForkMeterState } from './ForkMeterUI.tsx';
import { $appStore, UIState } from '../stores/animationStore';

interface ForkMeterProps {
  value?: number; // 0-100 for pointer position
  animated?: boolean;
  // Future: could add props for data source, refresh interval, etc.
}

const ForkMeter: React.FC<ForkMeterProps> = ({
  value = 75,
  animated = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(animated);
  
  // Subscribe to animation state
  useEffect(() => {
    const unsubscribe = $appStore.subscribe((state) => {
      const shouldShow = state.uiState === UIState.MAIN_CONTENT;
      setIsVisible(shouldShow);
      
      // Always animate when the component becomes visible, regardless of intro skip
      setShouldAnimate(animated);
    });

    // Initialize with current state
    const currentState = $appStore.get();
    const shouldShow = currentState.uiState === UIState.MAIN_CONTENT;
    setIsVisible(shouldShow);
    
    // Always use the animated prop, don't disable based on URL params
    setShouldAnimate(animated);

    return unsubscribe;
  }, [animated]);

  // Generate stable timestamp once
  const timestamp = useMemo(() => new Date().toISOString(), []);
  
  // Generate metadata based on component props and state
  const metadata: ForkMeterMetadata = useMemo(() => {
    // For values > 60%, we need prediction data
    if (value > 60) {
      return {
        value,
        animated: shouldAnimate,
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
      animated: shouldAnimate,
      last_updated: timestamp,
    };
  }, [value, shouldAnimate, timestamp]);

  // Don't render anything until animation state allows it
  if (!isVisible) {
    return null;
  }

  return <ForkMeterUI metadata={metadata} />;
};

export default ForkMeter;