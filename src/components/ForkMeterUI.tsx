import React, { useState, useEffect } from 'react';

enum ForkMeterState {
  STABLE = 'STABLE',
  WARNING = 'WARNING',
  FORK_IMMINENT = 'FORK_IMMINENT',
  CRITICAL = 'CRITICAL',
}

type ContentType = 'timestamp' | 'metadata' | 'custom';

interface StateConfig {
  minValue: number;
  maxValue: number;
  primaryText: string;
  secondaryContent: ContentType;
  customContent?: string;
}

// Base metadata always required
interface BaseForkMeterMetadata {
  value: number; // 0-100 for pointer position
  last_updated: string; // Always required timestamp (staple)
  animated?: boolean;
}

// For low-value states (≤60%) - minimal metadata
interface StableForkMeterMetadata extends BaseForkMeterMetadata {
  value: number; // 0-60 range
}

// For high-value states (>60%) - full prediction metadata required
interface ForkingForkMeterMetadata extends BaseForkMeterMetadata {
  value: number; // >60 range
  prediction: string;
  round: string;
  staked: string;
  remaining_time: string;
}

type ForkMeterMetadata = StableForkMeterMetadata | ForkingForkMeterMetadata;

interface ForkMeterProps {
  metadata: ForkMeterMetadata;
  stateMap?: Record<ForkMeterState, StateConfig>; // Optional custom state mapping
  customStateContent?: Record<string, string>; // Custom content for specific states
}

// Default state mapping
const defaultStateMap: Record<ForkMeterState, StateConfig> = {
  [ForkMeterState.STABLE]: {
    minValue: 0,
    maxValue: 10,
    primaryText: 'ALL MARKETS ARE STABLE',
    secondaryContent: 'timestamp'
  },
  [ForkMeterState.WARNING]: {
    minValue: 11,
    maxValue: 60,
    primaryText: 'MARKET VOLATILITY DETECTED',
    secondaryContent: 'metadata'
  },
  [ForkMeterState.FORK_IMMINENT]: {
    minValue: 61,
    maxValue: 80,
    primaryText: 'FORK CONDITIONS BUILDING',
    secondaryContent: 'metadata'
  },
  [ForkMeterState.CRITICAL]: {
    minValue: 81,
    maxValue: 100,
    primaryText: 'FORK IMMINENT - CRITICAL',
    secondaryContent: 'custom',
    customContent: 'EMERGENCY PROTOCOL ACTIVE'
  }
};

const ForkMeterUI: React.FC<ForkMeterProps> = ({
  metadata,
  stateMap = defaultStateMap,
  customStateContent = {},
}) => {
  // Destructure metadata
  const { value, last_updated, animated = true, ...rest } = metadata;
  const [currentValue, setCurrentValue] = useState(animated ? 0 : value);

  // Smooth animation to target value
  useEffect(() => {
    if (!animated) {
      setCurrentValue(value);
      return;
    }

    const targetValue = Math.max(0, Math.min(100, value));
    const startValue = currentValue;
    const duration = 1500; // 1.5 seconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const newValue = startValue + (targetValue - startValue) * easeOut;
      
      setCurrentValue(newValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [value, animated]);

  // Dynamic state resolution function
  const getCurrentState = (value: number, stateMap: Record<ForkMeterState, StateConfig>): ForkMeterState => {
    const stateEntry = Object.entries(stateMap).find(([_, config]) => 
      value >= config.minValue && value <= config.maxValue
    );
    return (stateEntry?.[0] as ForkMeterState) || ForkMeterState.FORK_IMMINENT;
  };

  // Get current state and configuration
  const currentState = getCurrentState(value, stateMap);
  const currentStateConfig = stateMap[currentState];

  // Runtime validation for required prediction fields when value > 60%
  const requiresPredictionData = value > 60;
  const hasRequiredFields = 'prediction' in rest && 'round' in rest && 'staked' in rest && 'remaining_time' in rest;
  
  if (requiresPredictionData && !hasRequiredFields) {
    console.error('ForkMeter: prediction, round, staked, and remaining_time are required when value > 60');
  }

  // Format timestamp for stable state display
  const formatTimestamp = (isoString: string): string => {
    const date = new Date(isoString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes} GMT`;
  };

  // SVG circle calculations
  const radius = 80;
  const circumference = Math.PI * radius; // Half circle circumference
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (currentValue / 100) * circumference;
  
  // Needle angle calculation (0° = left, 180° = right)
  const needleAngle = (currentValue / 100) * 180;

  return (
    <div className="mx-auto max-w-lg p-6">
      {/* SVG Gauge */}
      <div className="relative mb-2">
        <svg 
          viewBox="0 0 200 120" 
          className="w-[160px] mx-auto overflow-visible"
        >
          {/* Background arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="var(--color-green-500)"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.3"
          />
          
          {/* Foreground arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="var(--color-green-500)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            style={{
              filter: 'drop-shadow(0 0 6px var(--color-green-500))',
              transition: animated ? 'stroke-dashoffset 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
            }}
          />
          
          {/* Needle */}
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="28"
            stroke="var(--color-green-500)"
            strokeWidth="2"
            strokeLinecap="round"
            style={{
              transformOrigin: '100px 100px',
              transform: `rotate(${needleAngle - 90}deg)`,
              filter: 'drop-shadow(0 0 4px var(--color-green-500))',
              transition: animated ? 'transform 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
            }}
          />
          
          {/* Center dot */}
          <circle
            cx="100"
            cy="100"
            r="4"
            fill="var(--color-green-500)"
            style={{ filter: 'drop-shadow(0 0 4px var(--color-green-500))' }}
          />
        </svg>
      </div>

      {/* State-Based Content Rendering */}
      <p className="text-muted-foreground text-center break-words mb-1 uppercase tracking-wider">
        {currentStateConfig.primaryText}
      </p>
      
      {/* Secondary Content Based on State Configuration */}
      {currentStateConfig.secondaryContent === 'metadata' && hasRequiredFields && (
        <div className="flex justify-center items-center mb-2">
          <div className="font-bold px-4 border-r border-green-500/20">{(rest as any).round}</div>
          <div className="font-bold px-4">{(rest as any).remaining_time}</div>
          <div className="font-bold px-4 border-l border-green-500/20">{(rest as any).staked}</div>
        </div>
      )}
      
      {currentStateConfig.secondaryContent === 'custom' && (
        <div className="text-center mb-2">
          <div className="text-sm text-muted-foreground uppercase tracking-wider">
            {customStateContent[currentState] || currentStateConfig.customContent || 'CUSTOM STATE ACTIVE'}
          </div>
        </div>
      )}
      
      {/* Always Show Timestamp (Staple) */}
      <div className="text-center">
        <div className="text-sm">
          <span className="text-muted-foreground">LAST UPDATED:</span> <span className="text-foreground">{formatTimestamp(last_updated)}</span>
        </div>
      </div>
    </div>
  );
};

export default ForkMeterUI;

// Export types for use by wrapper component
export type { ForkMeterMetadata, ForkMeterProps as ForkMeterUIProps };
export { ForkMeterState, defaultStateMap };
