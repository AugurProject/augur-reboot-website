# Fork Risk Monitoring System

## Architecture Overview
The fork risk monitoring system uses a dual-runtime architecture with TypeScript project references:

**Frontend Runtime (Astro + React)**
- Config: `tsconfig.app.json`
- Location: `src/` directory
- Purpose: Interactive web UI with gauge visualization and data panels
- Key patterns: React Context for state management, 5-minute auto-refresh, demo mode integration

**Backend Scripts (Node.js)**
- Config: `tsconfig.scripts.json`
- Location: `scripts/` directory
- Purpose: Ethereum blockchain data collection and risk calculation
- Uses Node.js 22's native TypeScript support via --experimental-strip-types

## Data Flow & Risk Calculation
1. **Collection**: GitHub Actions runs `calculate-fork-risk.ts` hourly with RPC failover
2. **Storage**: Results saved to `public/data/fork-risk.json` (gitignored for fresh data)
3. **Consumption**: Frontend loads JSON via ForkRiskContext provider with auto-refresh
4. **Visualization**: React components render risk data in interactive SVG gauge

**Risk Formula**: `(Largest Dispute Bond / 275,000 REP) × 100 = Risk %`

## Key Development Patterns

**React Context Architecture**
- `ForkRiskContext.tsx` - Manages fork risk data loading with 5-minute refresh cycle
- `DemoContext.tsx` - Handles demo mode state with 5 risk scenarios (dev-only)
- Auto-failover to default data on fetch errors

**Demo Mode System (Development Only)**
- Activation: `F2` keyboard shortcut
- Scenarios: None, Low (1-10%), Moderate (10-25%), High (25-75%), Critical (75-98%)
- Production Safety: `if (!isDemoAvailable) return null` guards prevent demo in production builds

**TypeScript Project References**
- Root `tsconfig.json` coordinates both runtimes via project references
- `tsconfig.app.json` - Astro frontend with React integration
- `tsconfig.scripts.json` - Node.js scripts with ethers.js blockchain interaction
- Build cache in `.tscache/` (gitignored)

## Blockchain Integration Details
- **Smart Contracts**: Augur v2 mainnet addresses with ABI definitions in `contracts/augur-abis.json`
- **Event Monitoring**: Tracks three key events for accurate dispute assessment:
  - `DisputeCrowdsourcerCreated` (dispute initialization)
  - `DisputeCrowdsourcerContribution` (actual REP stakes - PRIMARY)
  - `DisputeCrowdsourcerCompleted` (exclude finished disputes)
- **RPC Endpoints**: Automatic failover across LlamaRPC, LinkPool, PublicNode, 1RPC
- **No API Keys**: Uses only public endpoints for zero-cost infrastructure
- **Error Handling**: Graceful degradation with fallback to cached/default data
- **Critical Fix**: Now uses actual contributed REP amounts (prevents 75x+ underestimation of fork risk)

## GitHub Actions Integration
- **Workflow**: `.github/workflows/sync-to-gh-pages.yml` runs `npm run build:fork-data` before build
- **Schedule**: Hourly cron job + manual dispatch with custom RPC URL support
- **Deployment**: Fresh data calculated and committed with each deployment

## Development Commands Specific to Fork Risk

```bash
# Calculate fresh fork risk data locally
npm run build:fork-data

# Check RPC endpoint being used
cat public/data/fork-risk.json | grep -A 3 "rpcInfo"

# Enable demo mode in development
# Press F2 in browser, then select risk scenarios
```