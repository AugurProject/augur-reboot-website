---
name: fork-gauge
description: This skill should be used when the user asks to "update the fork gauge", "change risk colors", "modify the gauge animation", "add a risk level", "update the SVG visualization", "fix the needle", "change the arc", or needs help with the fork risk visualization component and its data pipeline.
---

# Fork Gauge

The fork gauge is the primary visual indicator of Augur fork risk on the site. It consists of an SVG half-circle arc with a needle, a gradient color track, and a risk label — all driven by live blockchain data fetched from `/data/fork-risk.json`.

## Component Architecture

```
ForkMonitor (island entry point, client:load)
└── ForkDataProvider (React Context — loads live data)
    └── ForkMockProvider (React Context — demo overrides, dev-only)
        └── ForkDisplay (subscribes to contexts + animation store)
            └── ForkGauge (pure SVG renderer, takes percentage prop)
```

- **`ForkMonitor`** — The Astro island. Always use `client:load` so the gauge hydrates immediately.
- **`ForkDataProvider`** — Fetches `/data/fork-risk.json` on mount, refreshes every 5 minutes. Exposes data via `useForkData()`.
- **`ForkMockProvider`** — Dev-only demo layer. Wraps `ForkDataProvider` and can override data via `generateScenario()`. Guarded by `import.meta.env.PROD`.
- **`ForkDisplay`** — Composes the full UI. Subscribes to `$appStore` (animation state) and `useForkData()` (risk data).
- **`ForkGauge`** — Pure SVG component. Receives `percentage` prop (0–100). No data fetching, no context.

## Risk Levels

Risk levels flow from the JSON data through the provider to the gauge:

| JSON `riskLevel` | Display label | Color |
|-----------------|---------------|-------|
| `none` | NO RISK | `--color-green-400` |
| `low` | LOW | `--color-green-400` |
| `moderate` | MEDIUM | `--color-yellow-400` |
| `high` | HIGH | `--color-orange-400` |
| `critical` | EXTREME | `--color-red-500` |

The arc uses a `linearGradient` (green → yellow → orange → red) regardless of current level. The needle and center hub use the color for the current risk level.

## Visual Percentage Mapping

The gauge uses a non-linear scale to make risk visually intuitive. The `getVisualPercentage()` function in `ForkGauge.tsx` maps actual fork threshold percentage to visual gauge fill:

| Fork threshold % | Visual gauge % | Zone |
|-----------------|---------------|------|
| 0% | 0% | No risk |
| 0–10% | 0–25% | Low |
| 10–25% | 25–50% | Medium |
| 25–75% | 50–90% | High |
| 75%+ | 90–100% | Extreme |

When modifying risk thresholds or visual ranges, update `getVisualPercentage()` in `src/components/ForkGauge.tsx`.

## Common Workflows

### Update risk colors

Colors are defined in `getRiskColor()` in `ForkGauge.tsx`. Use CSS custom properties from the global theme:

```tsx
const getRiskColor = (forkThresholdPercent: number): string => {
  if (forkThresholdPercent < 10) return 'var(--color-green-400)'
  if (forkThresholdPercent < 25) return 'var(--color-yellow-400)'
  if (forkThresholdPercent < 75) return 'var(--color-orange-400)'
  return 'var(--color-red-500)'
}
```

The arc gradient is defined in the `<linearGradient id="forkMeterGradient">` SVG element. Update both if changing colors.

### Add glow effects

The arc path uses `className="fx-glow"`. For stronger or weaker glow, use size variants: `fx-glow-sm`, `fx-glow-lg`. The needle uses inline `filter: drop-shadow(...)` with the current risk color.

### Modify the arc geometry

The arc is a semicircle from left (180°) to right (0°). Key dimensions in `ForkGauge.tsx`:
- Center: `(200, 200)`
- Arc radius: `120`
- Needle radius: `100` (slightly shorter than arc)
- ViewBox: `"60 60 280 160"` (crops to the semicircle only)

### Test risk scenarios

Use demo mode — press **F2** in the browser during development to cycle through scenarios (None, Low, Moderate, High, Critical). This is guarded by `import.meta.env.PROD` and will not appear in production builds.

Alternatively, temporarily edit `/public/data/fork-risk.json` to test a specific state locally.

### Update the data pipeline

Live data flows from GitHub Actions → `/public/data/fork-risk.json` → `ForkDataProvider` → `ForkDisplay` → `ForkGauge`. The JSON is fetched client-side after hydration to avoid build-time failures.

See `references/data-pipeline.md` for the full JSON schema and pipeline details.

## Additional Resources

- **`references/data-pipeline.md`** — JSON schema, data flow, GitHub Actions update cycle
- **`references/svg-geometry.md`** — Arc math, needle calculation, coordinate system details
