# Fork Risk Data Pipeline

## JSON Schema

Fork risk data lives at `/public/data/fork-risk.json` and is served as a static asset.

```typescript
interface ForkRiskData {
  lastRiskChange: string        // ISO timestamp of last risk level change
  blockNumber: number           // Ethereum block number at last check
  riskLevel: 'none' | 'low' | 'moderate' | 'high' | 'critical' | 'unknown'
  riskPercentage: number        // 0–100, raw fork threshold percentage
  metrics: {
    largestDisputeBond: number  // REP staked in largest active dispute
    forkThresholdPercent: number
    activeDisputes: number
    disputeDetails: DisputeDetail[]
  }
  calculation: {
    forkThreshold: 275000       // REP required to trigger fork (protocol constant)
  }
  error?: string                // Present if last monitoring run had issues
}
```

## Data Flow

```
GitHub Actions (hourly)
  └── scripts/check-fork-risk.ts
      └── Reads Ethereum blockchain (RPC)
          └── Writes /public/data/fork-risk.json
              └── Deployed to gh-pages static assets
                  └── ForkDataProvider fetches on client hydration
                      └── Refreshes every 5 minutes
```

## Provider Behavior

`ForkDataProvider` fetches the JSON after hydration (not at build time):

```tsx
// Constructs URL respecting BASE_URL for GitHub Pages path prefix
const baseUrl = import.meta.env.BASE_URL || '/'
const dataUrl = `${baseUrl}data/fork-risk.json`
```

If the fetch fails, it falls back to a safe default (`riskLevel: 'none'`, `riskPercentage: 0`).

## Context API

Components consume fork data via `useForkData()`:

```tsx
import { useForkData } from '../providers/ForkDataProvider'

const { gaugeData, riskLevel, lastUpdated, isLoading, error } = useForkData()
// gaugeData.percentage — visual percentage for ForkGauge
// riskLevel.level — human-readable: 'No Risk' | 'Low' | 'Moderate' | 'High' | 'Critical'
// lastUpdated — formatted timestamp string
```

Must be used inside `<ForkDataProvider>`. Throws if used outside.

## Demo Override

`ForkMockProvider` wraps `ForkDataProvider` and exposes `useForkMock()`:

```tsx
import { useForkMock } from '../providers/ForkMockProvider'
import { DisputeBondScenario } from '../utils/demoDataGenerator'

const { generateScenario, resetToLive, isDemo, isDemoAvailable } = useForkMock()

// Trigger a demo scenario (dev-only)
generateScenario(DisputeBondScenario.HIGH_RISK)

// Return to live data
resetToLive()
```

`isDemoAvailable` is `false` in production (`import.meta.env.PROD`). Safe to include in code.

## Monitoring Cadence

The GitHub Actions workflow runs hourly. Data is static between runs. The 5-minute client refresh interval is deliberate — frequent enough to catch a new deploy without hammering the CDN.
