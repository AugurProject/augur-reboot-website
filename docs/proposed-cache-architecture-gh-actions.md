# Proposed Cache Architecture: GitHub Actions + Event-Driven Validation

**Status**: PROPOSAL (refined)
**Date**: January 21, 2026
**Context**: Addressing git commit noise and designing scalable infrastructure for ecosystem growth with hourly monitoring and lightweight validation

---

## Executive Summary

**Current Problem**: Event cache persists via git commits, creating noisy history when no events occur. Community notices poor maintenance signal.

**Proposed Solution**:
1. Move event cache to GitHub Actions cache storage (not git)
2. Only commit `fork-risk.json` when risk actually changes
3. Two-job architecture:
   - **Job 1 (Risk Monitor)**: Every 1 hour, incremental query (~300 blocks), lightweight validation (re-query last 8 blocks), commit only on risk change
   - **Job 2 (Cache Rebuild)**: Event-driven, triggered only when hourly validation detects cache mismatch
4. UI shows monitoring cadence ("Every hour") with tooltip for last change timestamp
5. Concurrency locking prevents manual rescans from conflicting with hourly scans

**Result**: Clean git history (silence = nothing happened), hourly monitoring builds community confidence, honest transparency, event-driven safety validation, acceptable RPC budget (~50 calls/day).

---

## The Problem We're Solving

### Current State

```
Event cache stored in git (gh-pages)
├─ Every 6 hours: run = new cache commit
├─ Result: 4 commits/day, 120 commits/month
├─ Community perception: "Why so many commits with no activity?"
└─ Git history: Noise, not signal
```

### Why This Matters

For a reboot project, git history signals maintenance quality:
- **Active commits** = active development (good)
- **Constant commits with no visible changes** = poor process (bad)
- **Commits only on real changes** = mature, intentional (good)

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

## Proposed Architecture

### Cache Storage: GitHub Actions Cache

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

## Implementation Checklist

### Phase 1: Update Workflow

**File**: `.github/workflows/build-and-deploy.yml`

Changes:
- [ ] Split into two jobs: `risk-monitor` (scheduled) and `cache-rebuild` (event-driven)
- [ ] Risk Monitor job:
  - [ ] Schedule: Every 1 hour (e.g., 0 * * * * for every hour on the hour)
  - [ ] Add `workflow_dispatch` trigger (manual execution)
  - [ ] Add `concurrency: { group: fork-risk-cache, cancel-in-progress: false }`
  - [ ] Restore event-cache from GH Actions
  - [ ] Query ~300 blocks (incremental)
  - [ ] Re-query last 8 blocks (validation)
  - [ ] Compare cached last-8-blocks vs fresh last-8-blocks
  - [ ] If mismatch: Log error + emit signal for Cache Rebuild to run
  - [ ] If match: Continue with normal flow
  - [ ] Save cache to GH Actions
  - [ ] Commit ONLY if `riskPercentage` changed
- [ ] Cache Rebuild job:
  - [ ] Add `workflow_dispatch` trigger (manual execution)
  - [ ] Add `concurrency: { group: fork-risk-cache, cancel-in-progress: false }`
  - [ ] Full 7-day blockchain rescan
  - [ ] Rebuild event-cache.json from scratch
  - [ ] Save rebuilt cache to GH Actions
  - [ ] Commit ONLY if risk % differs from last Monitor run
- [ ] Remove gh-pages cache persistence (use GH Actions cache instead)

### Phase 2: Update Script

**File**: `scripts/calculate-fork-risk.ts`

Changes:
- [ ] Reduce `FINALITY_DEPTH` from 32 to 8 blocks (re-query window for validation)
- [ ] Add lightweight validation function:
  - [ ] Re-query last 8 blocks fresh (without cache)
  - [ ] Extract disputes from fresh query
  - [ ] Compare against cached disputes in last 8 blocks
  - [ ] Return `{ isHealthy: boolean, discrepancy?: string }`
- [ ] In Risk Monitor: Call validation function after cache merge
- [ ] If validation fails: Log error, emit signal (e.g., set GH Actions output) for Cache Rebuild
- [ ] In Cache Rebuild: Skip validation (we're rebuilding from scratch)
- [ ] Ensure `lastUpdated` timestamp is always included in fork-risk.json output

### Phase 3: Update UI Components

**Files**: `src/components/ForkDisplay.tsx`, `src/providers/ForkDataProvider.tsx`

Changes:
- [ ] Replace "Last updated: {timestamp}" with "Monitored: Every hour"
- [ ] Add tooltip component on hover
- [ ] Tooltip displays: "Last changed: {relative time}" (e.g., "2 days ago", "just now")
- [ ] Ensure `lastUpdated` is always available from fork-risk.json
- [ ] Format `lastUpdated` as relative time (use date-fns or similar)

### Phase 4: Validation & Testing

- [ ] Pre-deployment dry-run:
  - [ ] Manually trigger Risk Monitor via "Run workflow" button
  - [ ] Verify it completes successfully
  - [ ] Check that cache was saved to GH Actions
  - [ ] Verify fork-risk.json updated (if risk changed)
- [ ] Manual Cache Rebuild trigger:
  - [ ] Trigger Cache Rebuild while Monitor is running
  - [ ] Verify it queues (doesn't run simultaneously)
  - [ ] Verify it completes without conflict
- [ ] Run first week of hourly schedules:
  - [ ] Monitor commits/day (should be sparse: 0-2 commits/day typically)
  - [ ] RPC budget per day (should be ~50-60 calls, no spikes)
  - [ ] Cache hit rate (should be 100%: every run incremental)
  - [ ] No unexpected Cache Rebuild triggers (unless cache corruption)
- [ ] Test UI:
  - [ ] Verify "Monitored: Every hour" displays correctly
  - [ ] Hover over text, verify tooltip shows "Last changed: ..."
  - [ ] Verify relative time formatting (e.g., "2 days ago", "3 hours ago")
  - [ ] Test with very fresh update (risk just changed, "Last changed: just now")

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

### What We Don't Have (vs Weekly Full Rescan)

1. **Scheduled full validation**: No weekly rescan—only event-driven rebuilds when corruption detected
   - *Rationale*: Hourly validation (last 8 blocks) catches issues within the hour. Weekly rescans are insurance, not detection.
   - *Risk acceptance*: If validation is broken, cache corruption persists until next Monitor run (max 1 hour). Acceptable for a non-financial tool.
2. **Public cache history**: Cache lives in GH Actions, not git
   - *Mitigation*: `fork-risk.json` fully auditable; GH Actions cache visible in workflow logs

### Design Philosophy: Event-Driven Over Scheduled

We chose **event-driven validation** over scheduled weekly validation because:

1. **Simpler operations**: One less recurring job to monitor
2. **Efficient resources**: Only runs when corruption detected (typically zero times)
3. **Faster feedback**: Operator can manually trigger rebuild anytime (e.g., post-deploy)
4. **Same safety**: Hourly validation catches drift immediately (within 1 hour vs 7 days)
5. **Better cost/benefit**: Weekly scans were insurance against corruption we'd detect within the hour anyway

### Is This Trade-off Worth It?

**For a reboot project**: Yes.
- Fork risk changes slowly (days/weeks, not minutes)
- Hourly monitoring beats 6-hourly for community confidence
- Clean history + active monitoring signal > infrequent updates
- Lightweight validation (8 blocks) catches cache issues fast
- Event-driven prevents noise from unnecessary rescans

**For a high-frequency financial system**: Maybe not.
- Would need scheduled full validation (insurance policy)
- Would need public cache history
- Would want <1-hour recovery SLA
- But fork risk monitoring isn't high-frequency

---

## Monitoring Post-Implementation

Track these metrics weekly:

1. **Commit frequency**: Should be sparse (~1-3 commits/week when disputes detected), never daily
2. **RPC budget/day**: Should be ~50-60 calls/day (confirm no unexpected spikes)
3. **Cache hit rate**: Should be 100% (every hourly run incremental, no cold-start queries except after >7 day inactivity)
4. **Validation health**: No mismatch detections = cache is clean. If mismatch detected: log the trigger, verify Cache Rebuild ran
5. **Rebuild frequency**: Typically 0 times/week (event-driven only). If >1 rebuild/week = investigate cache corruption bug
6. **Failure recovery**: Monitor failures should succeed on next run (within 1 hour). Rebuild failures should not break Monitor
7. **UI accuracy**: Verify "Monitored: Every hour" displays consistently. Tooltip shows accurate "Last changed: ..." timestamps

---

## References

- **Reorg data**: [Etherscan Forked Blocks](https://etherscan.io/blocks_forked)
- **Current caching**: `docs/rpc-caching-strategy.md`
- **Related decisions**: `docs/pending-fork-risk-decisions.md`
- **GitHub Actions cache**: [docs.github.com/actions/using-workflows/caching-dependencies-and-artifacts](https://docs.github.com/en/actions/using-workflows/caching-dependencies-and-artifacts/about-caching-dependencies)

---

**Status**: Design Complete (Ready for Implementation Planning)
**Final Architecture**:
- **Risk Monitor**: Hourly scheduled job + manual trigger, lightweight 8-block validation, 2-3 RPC calls/run
- **Cache Rebuild**: Event-driven on validation failure, full 7-day rescan, ~150 RPC calls per event (rare)
- **UI**: Shows "Monitored: Every hour" + tooltip "Last changed: X ago"
- **Concurrency**: Both jobs share lock group to prevent simultaneous cache writes
- **Result**: Clean git history + hourly monitoring confidence + ~50 RPC calls/day

**Next steps**:
1. ✅ Architecture finalized (this document)
2. Begin Phase 1: Update workflow file with hourly schedule, concurrency locking, event-driven trigger
3. Begin Phase 2: Update calculate-fork-risk.ts with lightweight validation logic
4. Begin Phase 3: Update UI to show monitoring cadence + tooltip
5. Phase 4: Dry-run testing and monitoring setup
