import React, { useState, useEffect } from 'react';

interface ForkMeterProps {
  prediction: string;
  round: string;
  remaining_time: string;
  staked: string;
  value: number; // 0-100 for pointer position
  animated?: boolean;
}

const ForkMeter: React.FC<ForkMeterProps> = ({
  prediction,
  round,
  remaining_time,
  staked,
  value,
  animated = true,
}) => {
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

  // SVG circle calculations
  const radius = 80;
  const circumference = Math.PI * radius; // Half circle circumference
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (currentValue / 100) * circumference;
  
  // Needle angle calculation (0° = left, 180° = right)
  const needleAngle = (currentValue / 100) * 180;

  return (
    <div className="mx-auto max-w-xl p-6">
      {/* SVG Gauge */}
      <div className="relative mb-2">
        <svg 
          viewBox="0 0 200 120" 
          className="w-[100px] mx-auto overflow-visible"
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

      {/* Prediction Text */}
      <div className="mb-2">
        <p className="font-console-narrow font-bold text-green-700 text-center text-xl md:text-base break-words">
          {prediction}
        </p>
      </div>

      {/* Metadata Row */}
      <div className="flex justify-center items-center font-console-narrow">
        <div className="text-xl px-4 border-r border-green-500/20">{round}</div>
        <div className="text-xl px-4">{remaining_time}</div>
        <div className="text-xl px-4 border-l border-green-500/20">{staked}</div>
      </div>
    </div>
  );
};

export default ForkMeter;
