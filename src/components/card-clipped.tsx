import type { CSSProperties, PropsWithChildren, ReactNode } from 'react';
import { cn } from '../lib/utils';

export interface ClippedCardProps {
  children: ReactNode;
  borderColor?: string;
  borderColorHover?: string;
}

/**
 * Nested clip-path technique: outer div's padding + background acts as border
 */
export function ClippedCardNested({ children, borderColor = '#2AE7A84D', borderColorHover = '#2AE7A899' }: ClippedCardProps) {
  const clipPathPolygon = 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)';

  return (
    <div
      className="relative"
      style={{
        clipPath: clipPathPolygon,
        padding: '1px',
        background: borderColor,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = borderColorHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = borderColor;
      }}
    >
      <div
        className="p-5 flex flex-col bg-background"
        style={{ clipPath: clipPathPolygon }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Gradient technique: single linear gradient for top-right beveled corner
 * Outer div shows border, inner div contains content
 */
export function ClippedCardGradient({ children }: PropsWithChildren) {
  return (
    <div
      className={cn(
        'h-full grid [grid-template-areas:"card"] relative',
        // Outer border (::before)
        'before:content-[\'\'] before:[grid-area:card] order-2',
        'before:[background:linear-gradient(225deg,transparent_10px,oklch(from_var(--color-primary)_l_c_h_/_0.3)_0)_top_right]',
        'hover:before:[background:linear-gradient(225deg,transparent_10px,oklch(from_var(--color-primary)_l_c_h_/_0.7)_0)_top_right]',
        'focus-within:before:[background:linear-gradient(225deg,transparent_10px,oklch(from_var(--color-primary)_l_c_h_/_0.7)_0)_top_right]',
        // Inner background (::after)
        'after:content-[\'\'] after:[grid-area:card] after:m-[1px] order-3',
        'after:[background:linear-gradient(225deg,transparent_10px,var(--color-background)_0)_top_right]',
        'hover:after:[background:linear-gradient(225deg,transparent_10px,oklch(from_var(--color-background)_l_c_h_/_0.8)_0)_top_right]',
        'focus-within:after:[background:linear-gradient(225deg,transparent_10px,oklch(from_var(--color-background)_l_c_h_/_0.8)_0)_top_right]',
      )}
    >
      <div className="[grid-area:card] order-1 py-1">
        {children}
      </div>
    </div>
  );
}
