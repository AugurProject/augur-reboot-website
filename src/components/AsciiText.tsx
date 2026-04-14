import { forwardRef } from 'react';
import { cn } from '../lib/utils';

export interface AsciiTextProps {
  className?: string;
  animated?: boolean;
  label?: string;
  children?: React.ReactNode;
}

const AsciiText = forwardRef<HTMLPreElement, AsciiTextProps>(
  ({ className, animated = false, label, children }, ref) => {
    return (
      <pre
        ref={ref}
        className={cn('ascii-text leading-none', className)}
        aria-label={label}
        style={{
          background: 'linear-gradient(to bottom, var(--color-green-600), var(--color-green-400), var(--color-green-600))',
          backgroundSize: '100% 200%',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 4px 0 #ffffff15)',
          ...(animated ? {
            animationName: 'gradient-animation',
            animationDuration: '2s',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
          } : {}),
        }}
      >
        {children}
      </pre>
    );
  }
);

AsciiText.displayName = 'AsciiText';

export default AsciiText;
