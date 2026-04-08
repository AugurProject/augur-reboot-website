import type { CSSProperties, ReactNode } from 'react';

interface BorderBeamProps {
  children: ReactNode;
  className?: string;
  duration?: number;       // seconds for one rotation
  beamWidth?: number;      // px spread of the glow
  colorFrom?: string;
  colorTo?: string;
}

/**
 * Wraps children in a container with an animated conic-gradient border beam.
 * Pure CSS – no external animation library required.
 */
const BorderBeam: React.FC<BorderBeamProps> = ({
  children,
  className = '',
  duration = 3,
  colorFrom = 'transparent',
  colorTo = 'var(--color-primary)',
}) => {
  const style: CSSProperties = {
    '--beam-duration': `${duration}s`,
    '--beam-color-from': colorFrom,
    '--beam-color-to': colorTo,
  } as CSSProperties;

  return (
    <span className={`border-beam-wrapper ${className}`} style={style}>
      <span className="border-beam-inner">
        {children}
      </span>
      <style>{`
        .border-beam-wrapper {
          position: relative;
          display: inline-block;
          border-radius: 0;
          padding: 1px;
          background: #070b07;
        }

        /* Rotating beam layer */
        .border-beam-wrapper::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          padding: 1px;
          background: conic-gradient(
            from var(--beam-angle, 0deg),
            transparent 0deg,
            transparent 270deg,
            var(--beam-color-to) 330deg,
            var(--beam-color-from) 360deg
          );
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: beam-spin var(--beam-duration) linear infinite;
          pointer-events: none;
        }

        @property --beam-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }

        @keyframes beam-spin {
          from { --beam-angle: 0deg; }
          to   { --beam-angle: 360deg; }
        }

        .border-beam-inner {
          display: block;
          position: relative;
          z-index: 1;
        }
      `}</style>
    </span>
  );
};

export default BorderBeam;
