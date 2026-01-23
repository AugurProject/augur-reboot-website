# Fork Risk Monitoring System

**Scope**: Complete hourly fork risk monitoring system for Augur built on GitHub Actions, with intelligent caching, lightweight validation, event-driven rebuilds, and community-facing UI messaging

---

## System Overview

**Frequency**: Every 1 hour on schedule (0 * * * *) + manual trigger
**Architecture**: Two-job workflow with concurrency locking
**Cache Storage**: GitHub Actions (not git)
**Commits**: Only when `fork-risk.json` risk percentage actually changes
**UI Signal**: "Levels monitored hourly" with tooltip showing last change time
**RPC Budget**: ~50 calls/day average (negligible cost)

---

## Ethereum Reorg Empirical Data

**From Etherscan + PoS research:**

| Metric | Value | Implication |
|--------|-------|------------|
| Reorg rate | ~1% of blocks | ~72 reorged blocks/day |
| Max observed | 7 blocks (May 2022) | Rare, made headlines |
| Typical | 1-2 blocks | Most reorgs tiny |
| Post-PoS finality | ~32 blocks (~6.4 min) | Consensus guarantee |

**For low-activity ecosystems**: Hourly scans catch disputes within minutes. Lightweight validation (re-query last 8 blocks) detects reorg-induced cache corruption within the hour. Auto-rebuild cache on mismatch prevents silent corruption.

---

## Architecture

### Cache Storage: GitHub Actions

GitHub provides free workflow caching (5GB per repo):

```yaml
# Restore cache from previous run
- name: Restore event cache
  uses: actions/cache@v4
  with:
    path: public/cache/event-cache.json
    key: event-cache-${{ runner.os }}
    restore-keys: event-cache-

# ... run fork risk calculation ...

# Save cache for next run
- name: Save event cache
  uses: actions/cache@v4
  with:
    path: public/cache/event-cache.json
    key: event-cache-${{ hashFiles('public/cache/event-cache.json') }}
```

**Advantages:**
- Persists between runs automatically (no git commits)
- Built into GitHub (no external dependencies)
- Can hold up to 5GB (cache will never exceed 1MB)
- Free for public repos

**Disadvantage:**
- Cache not publicly visible in git history (less transparent)
- Cache clears if repo inactive >7 days (but full query falls back)

### Two-Job Architecture: Scheduled Monitor + Event-Driven Rebuild

#### Job 1: Risk Monitor (Every 1 hour, on schedule + manual `workflow_dispatch`)

**Purpose**: Active fork risk monitoring with lightweight cache validation
**Execution**:
1. Restore event cache from GH Actions (or cold-start if missing)
2. Query incremental blocks (~300 blocks, ~1 hour of chain data)
3. Merge new disputes with cache
4. **Lightweight validation**: Re-query last 8 blocks fresh, compare against cache
   - If match: Cache is healthy, continue
   - If mismatch: Cache corrupted, trigger Job 2 (Cache Rebuild)
5. Calculate fork risk from cache
6. Save cache to GH Actions
7. Commit ONLY if `riskPercentage` changed

**RPC cost**: ~2-3 calls per run
**Commits**: Only when risk changes (not on every run)
**Frequency**: Every 1 hour (24 runs/day)
**Concurrency**: Uses `concurrency: fork-risk-cache` to prevent conflicts with Job 2

#### Job 2: Cache Rebuild (Event-driven + manual `workflow_dispatch`)

**Purpose**: Auto-heal cache when corruption detected by Job 1
**Trigger**: Automatically runs when Job 1 detects mismatch, OR manually via workflow dispatch
**Execution**:
1. Full 7-day blockchain rescan (150 RPC calls)
2. Rebuild event-cache.json from fresh data
3. Save rebuilt cache to GH Actions
4. Calculate fork risk
5. Commit ONLY if `riskPercentage` differs from what Job 1 last calculated

**RPC cost**: ~150 calls per event (typically rare)
**Commits**: Only if mismatch revealed actual risk change
**Frequency**: Only when corruption detected (typically zero times, or very rare)
**Concurrency**: Uses `concurrency: fork-risk-cache` to queue behind Job 1

### UI Display: Monitoring Cadence + Last Changed

**Main display**:
```
Fork risk: 2.1% • Monitored: Every hour
```

**On hover** (tooltip):
```
Last changed: 2 days ago
```

**Why this approach**:
- **Main message**: Clearly states monitoring frequency (honest, predictable)
- **Transparency**: Tooltip shows when risk actually changed (auditable)
- **No false staleness**: User understands "every 6 hours" is check frequency, not update frequency
- **Clean commits**: No heartbeat commits needed to show "proof of life"
- **Data already available**: `fork-risk.json` contains change timestamp from script

This solves the timestamp staleness problem: commits are sparse (only on risk changes), but UI communicates monitoring is active and continuous.

### Why This Works

```
Risk Monitor (hourly):
├─ Fast (incremental ~300 blocks only)
├─ Cheap (2-3 RPC calls per run)
├─ Lightweight validation built-in (re-query 8 blocks)
├─ No cache commits (clean history)
├─ Catches disputes within minutes
└─ Detects cache corruption within the hour

Cache Rebuild (event-driven):
├─ Triggers only when corruption detected
├─ Thorough (full 7-day rescan)
├─ Auto-heals cache from scratch
├─ Silently runs if no issues (zero cost most days)
└─ Manual trigger available for operators

Combined effect:
├─ Git history: Signal only (commits = real changes)
├─ RPC efficiency: ~50 calls/day (negligible)
├─ Community confidence: "Every hour" monitoring visible in UI
├─ Cache safety: Built-in validation with automatic recovery
└─ Operational transparency: Cache corruption auto-detected and fixed
```

### Example Execution Timeline

**Hourly monitoring (24-hour window):**
```
Monday 00:00  ✓ Monitor: cache validation OK (match) → NO COMMIT
Monday 01:00  ✓ Monitor: cache validation OK (match) → NO COMMIT
Monday 02:00  ✓ Monitor: cache validation OK (match) → NO COMMIT
...
Monday 12:00  ✓ Monitor: 1 new dispute added, risk 2.1% → 2.3% → COMMIT ✨
Monday 13:00  ✓ Monitor: cache validation OK (match) → NO COMMIT
Monday 14:00  ✗ Monitor: cache validation FAILED (mismatch detected)
              → Triggers Cache Rebuild job automatically
Monday 15:00  ⚙️  Cache Rebuild: Running full 7-day rescan (concurrency queue)
Monday 16:00  ✓ Cache Rebuild: Rescan complete, cache rebuilt, risk matches → NO COMMIT
Monday 17:00  ✓ Monitor: cache validation OK (match) → NO COMMIT
...
Tuesday 00:00 ✓ Monitor: no new disputes, cache valid → NO COMMIT
```

**UI during this entire period** (consistent, never stale):
```
Fork risk: 2.3% • Monitored: Every hour
                              [hover] → "Last changed: Monday at 12:00 PM"
```

**What happened in the background**:
1. **Lines 1-3, 5, 17-18**: Regular hourly scans, cache healthy, no commits
2. **Line 12**: Legitimate risk change detected → commit to git
3. **Line 14**: Lightweight validation caught cache corruption (mismatch in last 8 blocks)
4. **Lines 15-16**: Automatic cache rebuild triggered, full 7-day rescan ran, cache fixed
5. **Line 17+**: Back to normal hourly monitoring with clean cache

**Result**:
- Git history shows only real changes (Monday 12:00 commit when risk changed)
- UI always shows current risk % and "Monitored: Every hour" (high confidence signal)
- Cache corruption auto-detected and auto-healed (no manual intervention needed)
- Community sees clean git history + active hourly monitoring signal

---

## RPC Cost Analysis

### Per-Run Breakdown

**Risk Monitor (hourly, incremental):**
```
~300 blocks = 1 hour of chain data
1 getBlockNumber() call
1 queryFilter chunk × 2 calls = 2 calls
Total: ~2-3 RPC calls per run
```

**Cache Rebuild (event-driven, full rescan):**
```
~50,400 blocks = 7 days
1 getBlockNumber() call
51 queryFilter chunks × 3 calls = 51 calls
Total: ~150 RPC calls per event (rare, typically zero)
```

### Budget Summary (Normal Operation)

| Metric | Value | Public RPC Limit | Safety Margin |
|--------|-------|------------------|----------------|
| Monitor runs/day | 24 | - | - |
| Monitor calls/run | 2.5 avg | - | - |
| Monitor total/day | 60 calls | - | - |
| Rebuild runs/week | 0-1 (rare) | - | - |
| Rebuild calls/event | 150 | - | - |
| **Average/day** | **~50 calls** | 5K-50K/day | ✓ 99.9% below |
| **Rate limit** | 50 calls / 1 hour | 100-300/min | ✓ 120x below |

**Normal operation**: ~50 RPC calls/day, negligible cost. If cache corruption occurs (rare), one-time 150-call rebuild.

**Conclusion**: Extremely conservative RPC budget with hourly monitoring. Public endpoints handle this easily. Even if cache rebuilds weekly, total is only ~300 calls/week (~43/day average).

---

## Failure Handling

### Risk Monitor Failure

```
13:00 ✓ Success - cache validated, saved to GH Actions
14:00 ✗ Fails   - GH Actions cache still available, fork-risk.json NOT updated
15:00 ✓ Success - loads cached events, validation succeeds, incremental query works
```

**Key point**: GH Actions cache persists even if job fails. No data loss. Next run automatically recovers.

### Cache Rebuild Failure

```
Monitor detects cache mismatch at 14:00
  → Triggers Cache Rebuild job
  → Rebuild runs but fails (RPC timeout, etc.)
  → Cache Rebuild status: FAILED
  → Monitor continues with current (corrupted) cache
  → Next Monitor run (15:00) will detect mismatch again
  → Retry Cache Rebuild at 15:00
```

**Key point**: Rebuild failure doesn't corrupt git history. Retries automatically on next validation failure. Operators can manually trigger rebuild if needed.

### Concurrency Locking (Prevents Conflicts)

```
13:00 ✓ Monitor starts
13:05   Monitor detects mismatch → Signals Cache Rebuild
13:10   Cache Rebuild waiting (concurrency queue, Monitor still running)
13:15 ✓ Monitor finishes, releases lock
13:16   Cache Rebuild starts (now has exclusive access to cache)
14:00 ✓ Cache Rebuild finishes
14:00 ✓ Monitor starts (next scheduled run, lock available)
```

**Key point**: Both jobs share `concurrency: fork-risk-cache` group. Prevents simultaneous cache writes. Cache Rebuild queues if Monitor is running.

### Manual Trigger Safety

```
Monitor is running normally at 14:00
Operator manually triggers Cache Rebuild via "Run workflow" button
  → Cache Rebuild job created
  → Waits in concurrency queue (Monitor still running)
  → Once Monitor completes: Cache Rebuild starts
  → Operator can monitor via Actions tab
```

**Key point**: Manual triggers respect concurrency locking. Safe to trigger anytime. Jobs queue automatically.

### Cache Expiration (>7 days inactive)

If repo has no activity >7 days, GH Actions clears cache:
1. Next Monitor run detects missing cache
2. Falls back to full 7-day query (150 RPC calls, slow but works)
3. Rebuilds cache for subsequent runs
4. Returns to incremental queries (2-3 RPC calls/hour)

**Result**: One slower run, cache rebuilt, back to normal hourly monitoring. No data loss.

---

## Implementation

### Workflow (`.github/workflows/build-and-deploy.yml`)

**Two-job architecture with concurrency locking**:
- **Risk Monitor Job**: Runs hourly (`0 * * * *`) + manual trigger
  - Restores event cache from GitHub Actions
  - Queries incremental blocks (~300 blocks, ~1 hour of data)
  - Validates cache health: re-queries last 8 blocks fresh and compares vs cached
  - If validation passes: continues with incremental data
  - If validation fails: signals Cache Rebuild job to trigger
  - Commits `fork-risk.json` only if risk percentage changed
  - Saves event cache to GitHub Actions for next run

- **Cache Rebuild Job**: Event-driven trigger on validation failure + manual trigger
  - Full 7-day blockchain rescan (~50,400 blocks)
  - Rebuilds event cache from scratch
  - Saves rebuilt cache to GitHub Actions
  - Auto-heals cache corruption detected by Risk Monitor

- **Concurrency Control**: Both jobs share `concurrency: { group: fork-risk-cache, cancel-in-progress: false }`
  - Prevents simultaneous cache writes
  - Cache Rebuild queues behind Risk Monitor if needed

### Backend Script (`scripts/calculate-fork-risk.ts`)

- Added `CALCULATION_MODE` environment variable
  - `incremental`: Risk Monitor mode (~300 blocks, 2-3 RPC calls)
  - `full-rebuild`: Cache Rebuild mode (full 7-day query, ~150 RPC calls)
- Implemented `validateCacheHealth()` function
  - Re-queries last 8 blocks without cache
  - Compares fresh disputes vs cached disputes
  - Returns `{ isHealthy: boolean, discrepancy?: string }`
  - Detects blockchain reorgs within the hour
- Ensures `lastUpdated: string` timestamp in all output paths
  - Main fork risk calculation
  - Forking state results
  - Error results

### Frontend Components

**`src/components/ForkDisplay.tsx`**:
- Display changed from timestamp to monitoring cadence: "Levels monitored hourly"
- Shows text (button) on frequency of update with hover tooltip
- Tooltip shows: "Last changed: {relative time}" (e.g., "2 hours ago", "just now")
- Provided helper `formatRelativeTime()` for human-readable timestamps

**`src/providers/ForkDataProvider.tsx`**:
- Added `lastUpdated: string` to default fork data object
- Exposes `lastUpdated` from `useForkData()` hook
- Properly hydrates from fork-risk.json data

**`src/types/gauge.ts`**:
- Added `lastUpdated: string` to ForkRiskData interface

**`src/utils/demoDataGenerator.ts`**:
- Added `lastUpdated: now.toISOString()` to all demo scenarios

### Success Metrics

- Risk Monitor all steps executed without errors
- Cache restoration chain functioning (GH Actions → gh-pages fallback → full query)
- Incremental query running at 2-3 RPC calls per execution
- Validation function executing, no corruption detected
- Cache Rebuild properly skipped when cache is healthy
- Concurrency locking preventing race conditions
- UI displaying "Levels monitored hourly" correctly
- Relative time formatting working as specified
- TypeScript compilation passing with no errors

---

## Trade-offs & Decisions

### What We Gain

1. **Clean git history**: Commits only = real changes (no noise)
2. **High monitoring frequency**: Hourly scans build community confidence ("Every hour" visible in UI)
3. **Lightweight validation**: Re-query last 8 blocks detects cache corruption within the hour
4. **Auto-healing**: Event-driven Cache Rebuild fixes issues automatically (zero manual intervention)
5. **RPC efficiency**: ~50 calls/day, negligible cost even with hourly monitoring
6. **Operational flexibility**: Manual triggers for both Monitor and Rebuild (debug support)
7. **Operational clarity**: Clean git + clear UI messaging + transparent cache validation
8. **Scalability**: Works as activity increases (still under 1% of public RPC budget)

### Design Philosophy: Event-Driven Over Scheduled

We chose **event-driven validation** over scheduled weekly validation because:

1. **Simpler operations**: One less recurring job to monitor
2. **Efficient resources**: Only runs when corruption detected (typically zero times)
3. **Faster feedback**: Operator can manually trigger rebuild anytime (e.g., post-deploy)
4. **Same safety**: Hourly validation catches drift immediately (within 1 hour vs 7 days)
5. **Better cost/benefit**: Weekly scans were insurance against corruption we'd detect within the hour anyway

---

### Deployment Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Check Frequency | Every 6 hours | Every 1 hour | +6x more frequent |
| RPC Calls/Run | ~51 calls | ~2-3 calls | -96% per run |
| Total RPC/Day | ~8 calls/day | ~50-60 calls/day | More frequent, still negligible |
| Git Commits/Month | ~120 (4/day) | ~0-3 (only on changes) | -97% noise reduction |
| Cache Storage | gh-pages (git) | GitHub Actions | Cleaner separation |
| Validation | None | 8-block re-query | Corruption detection in <1 hour |
| Recovery | Manual | Automatic rebuild | Event-driven healing |

### Operational Characteristics

**Normal Operation** (~50 RPC calls/day):
- 24 hourly Risk Monitor runs
- Each run: ~2.5 RPC calls average
- Cache validation: ~1 call per run
- Cache Rebuild: ~0 events/week (only on detected corruption)

**Abnormal Case** (1 cache rebuild/week):
- Risk Monitor: 24 × 7 × 2.5 = 420 calls/week
- Cache Rebuild: 1 × 150 = 150 calls/week
- Total: ~570 calls/week (~81/day average) - still <1% of public RPC limit

**Git History Impact**:
- Before: ~120 commits/month (noisy, hard to track changes)
- After: ~0-3 commits/month (signal-only, commits = real fork risk events)

### Why This Architecture Works

**Efficiency**:
- Incremental queries (~300 blocks) require only 2-3 RPC calls vs 51 calls for full query
- Cache persists in GitHub Actions, no git history pollution
- Hourly frequency provides up-to-the-hour monitoring without breaking RPC budget

**Safety**:
- 8-block validation (lightweight re-query) detects blockchain reorgs within the hour
- Event-driven rebuilds heal cache corruption automatically
- Concurrency locking prevents simultaneous cache writes
- 3-tier fallback ensures graceful degradation if cache expires

**Transparency**:
- UI clearly states "Levels monitored hourly" (community confidence signal)
- Tooltip shows when risk actually changed (auditable, not stale)
- Git history is signal-only (commits = meaningful events)
- No heartbeat commits needed to prove "proof of life"

**Scalability**:
- Works as activity increases (still negligible RPC cost)
- Same architecture supports 10x activity increase
- Event-driven validation means no schedule changes needed

### Failure Handling

| Scenario | Detection | Recovery |
|----------|-----------|----------|
| Cache expiration (>7 days) | Missing cache file | Falls back to full 7-day query (one slow run) |
| GH Actions cache miss | No restore hit | Falls back to gh-pages or full query |
| Blockchain reorg (1-8 blocks) | 8-block validation mismatch | Cache Rebuild triggered automatically |
| Risk Monitor failure | Job fails | Cache persists, next run retries automatically |
| Cache Rebuild failure | Job fails | Cache unchanged, validation re-triggers next hour |
| Concurrency conflict | Queue management | Cache Rebuild waits in queue until Monitor completes |

### Monitoring & Maintenance

Track weekly:
1. **Commit frequency**: Should be 0-1 commits/week (signal of real fork risk events)
2. **RPC budget**: Should be 50-60 calls/day (confirm no spikes)
3. **Cache hit rate**: Should be 100% (all runs incremental, no full queries)
4. **Validation health**: 0 mismatch detections = healthy cache
5. **Rebuild frequency**: Typically 0 times/week (event-driven = rare)
6. **UI accuracy**: "Levels monitored hourly" displaying + tooltip working correctly

### GitHub Actions Warning Logging

The fork risk monitoring system emits structured GitHub Actions warnings (`::warning::` and `::error::`) to provide operational visibility:

**Warnings by Event:**

| Event | Condition | Message | Action |
|-------|-----------|---------|--------|
| Cache validation failure | `cacheValidation.isHealthy = false` | `::warning::Cache validation failed: {discrepancy} - triggering full cache rebuild` | Auto-triggers cache-rebuild job |
| Cache rebuild execution | Cache-rebuild job starts | `::warning::Full cache rebuild triggered - rescanning 7-day history from blockchain` | Alerts team of expensive operation |
| RPC fallback in use | Primary endpoints fail | `::warning::Using RPC fallback endpoint ({n} previous failures)` | Indicates RPC reliability issue |
| All RPC endpoints fail | All four endpoints exhausted | `::error::All RPC endpoints failed (attempted {n})` | Blocks calculation, returns error result |

**Where to Monitor Warnings:**

1. **GitHub Actions UI**: Workflow run summary shows warnings prominently
2. **Pull Requests**: Warnings appear in PR deployment logs
3. **Notifications**: Integrate with Slack/Discord via GitHub Actions apps
4. **Logs**: All warnings logged to GitHub Actions step logs for debugging

**Operational Interpretation:**

- `::warning::` messages indicate degraded operation or automatic recovery
- Multiple cache validation warnings in 24 hours = investigate RPC health
- RPC fallback warnings = consider adding custom RPC endpoint
- `::error::` = system cannot complete calculation (check RPC endpoints)

---

## References

- **Reorg data**: [Etherscan Forked Blocks](https://etherscan.io/blocks_forked)
- **GitHub Actions cache**: [docs.github.com/actions/using-workflows/caching-dependencies-and-artifacts](https://docs.github.com/en/actions/using-workflows/caching-dependencies-and-artifacts/about-caching-dependencies)
- **Ethereum Finality**: [ethereum.org/developers/docs/consensus-mechanisms/pos](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/)
