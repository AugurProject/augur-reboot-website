import { forwardRef } from 'react';
import { cn } from '../lib/utils';

export interface AsciiTextProps {
  className?: string;
  animated?: boolean;
  label?: string;
  content?: string;
  children?: React.ReactNode;
}

const AsciiText = forwardRef<HTMLPreElement, AsciiTextProps>(
  ({ className, label, content, children }, ref) => {
    return (
      <pre
        ref={ref}
        className={cn(
          'bg-clip-text bg-linear-to-b from-green-600 via-green-400 to-green-600',
          'bg-size-[100%_200%]',
          className
        )}
        role="img"
        aria-label={label}
        style={{ WebkitTextFillColor: 'transparent' }}
      >
        {content || children}
      </pre>
    );
  }
);

AsciiText.displayName = 'AsciiText';

export default AsciiText;
