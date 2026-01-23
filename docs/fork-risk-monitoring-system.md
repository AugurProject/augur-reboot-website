# Fork Risk Monitoring System

> **Purpose**: How we continuously monitor Augur fork risk 24/7 using GitHub Actions.
> **Complementary doc**: See `fork-risk-assessment.md` for calculation methodology and risk thresholds.

---

## Overview

| Aspect | Value |
|--------|-------|
| Frequency | Hourly (0 * * * *) + manual trigger |
| Architecture | Two-job workflow with concurrency locking |
| Cache | GitHub Actions cache only (ephemeral, ~7 day TTL) |
| Commits | Only when risk percentage changes |
| UI Signal | "Levels monitored hourly" + last change timestamp |

---

## Why Hourly Monitoring is Sufficient

Augur disputes have 7-day resolution windows. Hourly checks provide:
- Detection within ~60 minutes of any dispute activity
- 168 data points per dispute window (far exceeds requirements)
- Negligible RPC cost (~50 calls/day)

See: `scripts/calculate-fork-risk.ts:508-540` for incremental query implementation.

---

## Architecture

### Cache Strategy

**Single-tier: GitHub Actions cache only**

```
┌─────────────────────────────────────────────────────────┐
│ Hourly Run                                              │
├─────────────────────────────────────────────────────────┤
│ 1. Restore cache from GH Actions                        │
│ 2. If miss → bootstrap empty cache → full 7-day query   │
│ 3. Run incremental calculation (query recent blocks)    │
│ 4. Validate cache (8-block shallow requery)             │
│ 5. Save cache to GH Actions                             │
│ 6. If validation fails → trigger cache-rebuild job      │
└─────────────────────────────────────────────────────────┘
```

**Why no git persistence for cache:**
- event-cache.json changes every run (block numbers update)
- Git commits would create hourly noise
- GH Actions cache provides sufficient persistence (~7 days)
- Full rebuild from blockchain is cheap (~50 RPC calls)

See: `.github/workflows/build-and-deploy.yml:118-138` for cache restoration logic.

### Two-Job Workflow

**Job 1: risk-monitor** (hourly)
- Runs incremental fork risk calculation
- Validates cache against blockchain (8-block requery)
- Outputs: `risk-changed`, `needs-rebuild`

**Job 2: cache-rebuild** (event-driven)
- Triggered only when `needs-rebuild == true`
- Performs full 7-day blockchain rescan
- Repopulates cache from scratch

See: `.github/workflows/build-and-deploy.yml:69-191` (risk-monitor), `:192-231` (cache-rebuild)

### Concurrency Locking

Both jobs share concurrency group `fork-risk-cache` with `cancel-in-progress: false`:
- Prevents parallel cache writes
- Queues rather than cancels (preserves data integrity)

---

## Cache Validation

**Problem**: Ethereum reorgs can invalidate cached event data.

**Solution**: 8-block shallow requery on each run:
1. Re-fetch events from last 8 blocks
2. Compare against cached events for same block range
3. If mismatch → set `cacheValidation.isHealthy = false`
4. Workflow reads this and triggers cache-rebuild job

**Why 8 blocks**: Covers 99%+ of reorgs (max observed: 7 blocks in May 2022).

See: `scripts/calculate-fork-risk.ts:580-650` for validation implementation.

---

## Data Flow

```
GitHub Actions (hourly)
    │
    ▼
calculate-fork-risk.ts
    │
    ├── Query blockchain (Ethereum mainnet)
    ├── Calculate risk % = (largest bond / 275K REP) × 100
    ├── Validate cache (8-block requery)
    │
    ▼
public/data/fork-risk.json
    │
    ▼
Astro build → dist/data/fork-risk.json
    │
    ▼
GitHub Pages deployment
    │
    ▼
Frontend fetches JSON → displays gauge
```

---

## Output: fork-risk.json

```json
{
  "lastRiskChange": "2026-01-23T04:44:20.440Z",
  "blockNumber": 24295180,
  "riskLevel": "none",
  "riskPercentage": 0,
  "metrics": {
    "largestDisputeBond": 0,
    "forkThresholdPercent": 0,
    "activeDisputes": 0,
    "disputeDetails": []
  },
  "rpcInfo": {
    "endpoint": "https://eth.llamarpc.com",
    "latency": 632,
    "fallbacksAttempted": 0
  },
  "calculation": {
    "forkThreshold": 275000
  },
  "cacheValidation": {
    "isHealthy": true
  }
}
```

See: `src/types/gauge.ts:11-41` for TypeScript interface.

---

## GitHub Actions Warning Logging

Structured warnings for operational visibility:

| Event | Condition | Message |
|-------|-----------|---------|
| Cache validation failure | `isHealthy = false` | `::warning::Cache validation failed: {discrepancy}` |
| Cache rebuild triggered | cache-rebuild job starts | `::warning::Full cache rebuild triggered` |
| RPC fallback | Primary endpoint fails | `::warning::Using RPC fallback endpoint` |
| All RPC fail | All 4 endpoints fail | `::error::All RPC endpoints failed` |

See: `.github/workflows/build-and-deploy.yml:157-162` (validation warning), `scripts/calculate-fork-risk.ts:218-224` (RPC warnings)

---

## Failure Handling

| Scenario | Detection | Recovery |
|----------|-----------|----------|
| RPC endpoint down | Connection timeout | Auto-fallback to next endpoint |
| All RPC endpoints down | All 4 fail | Error state in JSON, retry next hour |
| Cache corruption (reorg) | Validation mismatch | Auto-rebuild triggered |
| GH Actions cache miss | No restore hit | Bootstrap + full 7-day query |
| Workflow failure | Job fails | Cache unchanged, retry next hour |

---

## RPC Cost Analysis

**Per-run (incremental):**
- Block number query: 1 call
- Contract state checks: 2-3 calls
- Event queries: ~1 call (narrow block range)
- **Total: ~5 calls/run**

**Daily budget:**
- 24 runs × 5 calls = ~120 calls
- With caching efficiency: ~50 calls/day actual
- Well within free tier limits

---

## Code References

| Component | Location |
|-----------|----------|
| Workflow | `.github/workflows/build-and-deploy.yml` |
| Calculation script | `scripts/calculate-fork-risk.ts` |
| TypeScript interface | `src/types/gauge.ts:11-41` |
| Data provider | `src/providers/ForkDataProvider.tsx` |
| Gauge display | `src/components/ForkRiskGauge.tsx` |
| Details card | `src/components/ForkDetailsCard.tsx` |

---

## References

- [Etherscan Forked Blocks](https://etherscan.io/blocks_forked)
- [GitHub Actions Caching](https://docs.github.com/en/actions/using-workflows/caching-dependencies-and-artifacts)
- [Ethereum PoS Finality](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/)
