# Fork Gauge SVG Geometry

## Coordinate System

The gauge SVG uses a 400×400 internal coordinate space cropped with `viewBox="60 60 280 160"` to show only the upper semicircle.

```
viewBox crops to: x=60, y=60, width=280, height=160
Center point: (200, 200) — sits at the bottom of the visible area
Arc radius: 120
Needle radius: 100 (shorter than arc to show gap)
```

## Arc Path

The arc is a semicircle from left (180°) to right (0°):

```
Start point: M 80 200    (leftmost point: center_x - radius = 200 - 120)
End point:   320 200     (rightmost point: center_x + radius = 200 + 120)
```

The dynamic arc path is computed in `updateArc()`:

```typescript
const angle = Math.PI - (visualPercentage / 100) * Math.PI
// 0% → angle = π (full left, no fill)
// 100% → angle = 0 (full right, fully filled)

const endX = centerX + radius * Math.cos(angle)
const endY = centerY - radius * Math.sin(angle)

return `M 80 200 A 120 120 0 0 1 ${endX} ${endY}`
```

## Needle

The needle pivots from center `(200, 200)` to the same angle as the arc tip, but at `radius=100`:

```typescript
const angle = Math.PI - (visualPercentage / 100) * Math.PI
return {
  x: centerX + 100 * Math.cos(angle),
  y: centerY - 100 * Math.sin(angle)
}
```

The needle includes a shadow offset `(+2, +2)` for depth, and uses `drop-shadow` filter for glow.

## Gradient

The arc fill uses a horizontal linear gradient spanning the full arc width:

```svg
<linearGradient id="forkMeterGradient"
  x1="80" y1="200" x2="320" y2="200"
  gradientUnits="userSpaceOnUse">
  <stop offset="0%"   stopColor="var(--color-green-400)" />
  <stop offset="35%"  stopColor="var(--color-green-500)" />
  <stop offset="55%"  stopColor="var(--color-yellow-400)" />
  <stop offset="80%"  stopColor="var(--color-orange-400)" />
  <stop offset="100%" stopColor="var(--color-red-500)" />
</linearGradient>
```

Since `gradientUnits="userSpaceOnUse"`, gradient positions are absolute coordinates (not percentages of the element). Changing the arc radius or position requires updating these coordinates.

## Risk Text

The risk level label is rendered as an SVG `<text>` element at `(200, 165)` — above center, within the arc curve:

```svg
<text x="200" y="165" textAnchor="middle"
  fill={riskColor}
  fontSize="2.15rem" fontWeight="bold"
  className="fx-glow-sm">
  {riskLabel}
</text>
```

## Transition

The needle group has CSS transition for smooth movement:

```tsx
<g style={{ transition: 'all 0.3s ease-in-out' }}>
```

This animates needle position when `percentage` prop changes. No animation library needed — SVG + CSS transition handles it.
