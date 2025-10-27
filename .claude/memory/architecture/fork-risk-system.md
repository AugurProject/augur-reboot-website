# Fork Risk Monitoring System Architecture

## Overview

Real-time visualization of Augur v2 protocol fork risk based on active dispute bonds. Uses dual-runtime TypeScript with automated blockchain data collection and 5-minute client refresh.

## Dual-Runtime Architecture

### Frontend Runtime (Astro + React)
- **Config**: `tsconfig.app.json`
- **Location**: `src/` directory
- **Technology**: Astro 5.10+, React 19, Nanostores
- **Purpose**: Interactive gauge visualization, data panels, demo controls
- **Hydration**: `client:load` for immediate JavaScript execution

### Backend Scripts (Node.js)
- **Config**: `tsconfig.scripts.json`
- **Location**: `scripts/` directory
- **Technology**: Node.js 22, ethers.js, TypeScript via `--experimental-strip-types`
- **Purpose**: Ethereum blockchain data collection and risk calculation
- **Execution**: GitHub Actions (hourly) or manual local run

## Data Flow Pipeline

```
1. COLLECTION (GitHub Actions hourly)
   └─> calculate-fork-risk.ts
       └─> Ethereum RPC calls
           └─> DisputeCrowdsourcer events
               └─> Actual REP contributions extracted

2. STORAGE (Version controlled)
   └─> public/data/fork-risk.json
       └─> gitignored for fresh data on each build
           └─> GitHub Actions commits fresh data

3. CONSUMPTION (Frontend)
   └─> ForkDataProvider.tsx
       └─> Auto-refresh every 5 minutes
           └─> Error fallback to cached data

4. VISUALIZATION (React)
   └─> ForkGauge.tsx (SVG animated gauge)
   └─> ForkStats.tsx (Data panels)
   └─> ForkDisplay.tsx (Orchestration)
```

## Risk Calculation Formula

```
Risk % = (Largest Dispute Bond / 275,000 REP) × 100
```

This represents the percentage of total Augur v2 supply at stake in the largest active dispute. Higher percentages indicate higher fork risk.

## Blockchain Integration Details

### Smart Contract Monitoring

**Augur v2 Mainnet Addresses** (in `contracts/augur-abis.json`):
- Augur v2 Contract
- DisputeCrowdsourcer Contract

### Event Tracking

Track three key events for accurate dispute assessment:

| Event | Purpose | Notes |
|-------|---------|-------|
| `DisputeCrowdsourcerCreated` | Dispute initialization | Signals new dispute started |
| `DisputeCrowdsourcerContribution` | REP stakes | PRIMARY SOURCE - actual contributed amounts |
| `DisputeCrowdsourcerCompleted` | Dispute settlement | Exclude from active calculation |

**Critical Fix**: Uses actual contributed REP amounts (prevents 75x+ underestimation of fork risk)

### RPC Endpoint Failover

Public endpoints with automatic failover:
1. **LlamaRPC** (primary)
2. **LinkPool**
3. **PublicNode**
4. **1RPC**

Benefits:
- Zero API keys required
- Zero cost infrastructure
- Graceful degradation on endpoint failure
- Fallback to cached data on all failures

## Component Architecture

### Data Providers (Context)

**ForkDataProvider.tsx**
- Manages fork risk data loading
- 5-minute auto-refresh cycle
- Error handling with cached fallback
- Exposes: `ForkRiskContext` with data + loading state

**ForkMockProvider.tsx**
- Demo mode state management
- 5 risk scenarios: None, Low (1-10%), Moderate (10-25%), High (25-75%), Critical (75-98%)
- Activation: `F2` keyboard shortcut (dev mode only)
- Production safe: `if (!isDemoAvailable) return null` guards

### Display Components

**ForkGauge.tsx**
- SVG-based animated gauge visualization
- Displays 0-100% risk percentage
- Smooth animations on data updates

**ForkStats.tsx**
- Responsive data panels
- Displays: Risk level, REP staked, dispute count
- Mobile-friendly grid layout

**ForkDisplay.tsx**
- Orchestration component
- Combines ForkGauge + ForkStats
- Handles loading states

**ForkControls.tsx**
- Development-only demo overlay
- `F2` key triggers mode selection
- Production-safe with feature guards

**ForkBadge.tsx**
- Badge component for fork status
- Can be used in other UI sections
- Shows risk level indicator

**ForkMonitor.tsx**
- Main integration component
- Wraps gauge + stats + controls
- Handles provider composition

## TypeScript Project References

Root `tsconfig.json` coordinates both runtimes:

```json
{
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.scripts.json" }
  ]
}
```

Benefits:
- Separate compilation contexts for frontend/backend
- Proper module resolution for each runtime
- Build cache in `.tscache/` (gitignored)

**Note**: Run `npm run typecheck` for full type validation

## GitHub Actions Integration

### Workflow

**File**: `.github/workflows/sync-to-gh-pages.yml`

**Process**:
1. Runs `npm run build:fork-data` before build
2. Fresh data calculated with blockchain calls
3. Data committed with new build
4. Deployed to GitHub Pages

### Schedule

- **Automatic**: Hourly cron job
- **Manual**: Dispatch with custom RPC URL support

### Deployment

Each deployment gets fresh fork risk data, ensuring production always displays current risk levels.

## Development Commands

```bash
# Calculate fresh fork risk data locally
npm run build:fork-data

# Check RPC endpoint used and success rate
cat public/data/fork-risk.json | jq '.rpcInfo'

# Enable demo mode in development
# Press F2 in browser, then select risk scenario
```

## Error Handling Strategy

1. **RPC Endpoint Failure**: Auto-failover to next endpoint
2. **All Endpoints Failed**: Fall back to cached/default data
3. **Data Parsing Error**: Use last known good state
4. **Frontend Fetch Error**: Retry on next 5-minute cycle

This ensures the system degrades gracefully and never breaks the UI.

## Performance Considerations

- **Data Update Frequency**: 5 minutes on client (hourly calculation server-side)
- **File Size**: `fork-risk.json` is < 5KB
- **Network**: Single HTTP request per refresh
- **GPU**: SVG animations are GPU-accelerated
- **Memory**: No memory leaks (proper WebGL cleanup in Gauge component)

## Testing Fork Risk System

```bash
# Local calculation
npm run build:fork-data

# Verify data format
jq . public/data/fork-risk.json

# Check in dev browser
# Press F2 to enable demo mode
# Try different scenarios: None, Low, Moderate, High, Critical
```

## References

- **Components**: `.claude/memory/architecture/components.md`
- **Conventions**: `.claude/memory/conventions/fork-risk-patterns.md`
- **Project Overview**: `.claude/memory/project_overview.md`
