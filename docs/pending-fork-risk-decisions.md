# Fork Risk System Architecture Decisions

## Problem Context

The fork risk system has six risk level states:
- `'none'` - 0% (no disputes at all)
- `'low'` - <10%
- `'moderate'` - 10-25%
- `'high'` - 25-75%
- `'critical'` - ≥75%
- `'unknown'` - RPC failure (unable to fetch blockchain data)

When the script runs and **fails to fetch RPC data**, it outputs `'unknown'`. This creates a semantic question about how the UI should handle this state.

## Current Implementation

Currently, both `'unknown'` and `'none'` display as `'No Risk'` to the user (see `ForkDataProvider.tsx` convertToRiskLevel function).

```typescript
case 'unknown':
case 'none':
default:
    level = 'No Risk'
```

## Decision Needed

**There are two approaches:**

### Option A: Show Stale Data Instead of "Unknown"
- When RPC fails, continue displaying the **last known risk level** from the previous successful run
- The JSON file persists on gh-pages, so historical data is always available
- Advantage: Never shows incorrect "No Risk" when we actually had data last time
- Disadvantage: Could show outdated risk state if RPC is down for hours
- **Better for user trust** - users see "we don't know, here's the last value we knew"

### Option B: Show "No Risk" for Unknown (Current)
- When RPC fails, treat it like `'none'` (show as "No Risk")
- Simpler to implement
- Advantage: Reduces UI complexity
- Disadvantage: Misleading - "No Risk" implies zero disputes, not "data unavailable"
- **Risk of false negatives** - users might think system is safe when we're just blind

## Workflow Behavior

From `.github/workflows/build-and-deploy.yml`:
1. Script fetches RPC data (line 79-84)
2. On success: outputs valid risk data
3. On failure: outputs error state with `riskLevel: 'unknown'`
4. JSON file always gets written (line 153-154 fallback)
5. Previous JSON persists if script fails
6. Next run reads old JSON if available (line 157)

## Recommendation

**Implement Option A** - Show stale data instead of "unknown" as "No Risk":
- Add last-known-good state tracking
- When `'unknown'` is detected, use previous risk level if available
- Only show "No Risk" if we have literally never fetched data
- This is more transparent about data freshness

## Implementation Steps (Future)

1. Track previous risk level in context
2. On `'unknown'` state, check if previous data exists
3. If previous risk > 0%, display it with staleness warning
4. If no previous data, show "Data Unavailable" instead of "No Risk"
5. Add timestamp indication so users know how old data is

## Timeline

Defer implementation pending user feedback on acceptable staleness thresholds.

---

## Cache Persistence Architecture

### Problem

The event caching strategy is designed to achieve 98% RPC reduction by:
- Querying only new blocks since last run (+ 32 blocks back for finality)
- Maintaining a rolling 7-day event cache
- Re-using cached events across multiple deployments

**However, cache persistence was broken:**
- Cache lives in `public/cache/event-cache.json` locally
- Must be committed to `gh-pages` branch for persistence across runs
- Current workflow only commits cache if:
  - Risk changed (immediate)
  - Daily at midnight AND events > 0
- Result: If first deployment found no events, cache never persisted
- On next run: Cache missing from gh-pages → falls back to full 7-day query
- Effect: 98% RPC reduction never materialized

### Current Workflow Issues

Single `build-and-deploy.yml` job tries to handle:
1. Scheduled runs (every 6 hours)
2. Manual triggers
3. Push/PR events
4. Cache management
5. Risk change detection

Result: Complex conditional logic that loses cache in edge cases.

### Proposed Solution: Dual-Job Architecture

**Job 1: Daily Cache Guardian** (new)
- Trigger: Scheduled daily at 00:05 UTC only
- Purpose: Guarantee cache persistence every 24 hours
- Action: Always commits `cache/event-cache.json` to gh-pages
- Benefits:
  - Cache always available for next run
  - Incremental querying always works
  - No spam (once per day)

**Job 2: Risk Monitor** (modified existing)
- Trigger: Scheduled at 06:05, 12:05, 18:05 UTC + push/PR/manual
- Purpose: Alert on meaningful changes
- Action: Only commits if risk changed OR events found
- Skips trivial runs with no changes
- Benefits:
  - Immediate alerts on new disputes
  - No commit spam on empty runs
  - Clear separation from cache management

### Implementation

1. Create new `cache-persistence.yml` workflow (daily midnight commitment)
2. Update `build-and-deploy.yml`:
   - Remove 00:05 UTC from cron schedule
   - Simplify logic (no need to handle daily case)
   - Focus on risk monitoring only
3. Bootstrap initial cache:
   - Manually run workflow once
   - Commit resulting cache to gh-pages
   - Subsequent runs inherit persistent cache

### Benefits

✅ Cache always persists (daily backup)
✅ Incremental querying works reliably (98% RPC reduction achieved)
✅ No commit spam on runs with no changes
✅ Risk changes get immediate alerts
✅ Clear responsibility separation
✅ Simpler conditional logic in each job

### Timeline

Implement dual-job architecture and bootstrap cache in this branch.
