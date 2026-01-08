# RPC Caching Strategy

**Last Updated:** January 8, 2026 | **Version:** 1.0
**Maintained By:** Augur Fork Meter Project

## Overview

This document describes the incremental event caching system implemented for the Augur fork risk monitoring infrastructure. The caching strategy reduces RPC endpoint queries by 98% while maintaining data accuracy and blockchain finality guarantees.

### Why Caching Was Implemented

The original implementation queried Ethereum mainnet every hour, requesting ~50,400 blocks (7 days) in 1000-block chunks, resulting in ~51 RPC queries per run. With hourly execution, this totaled **~1,200 queries per day** to public RPC endpoints.

This approach faced several challenges:
- **Rate limiting**: Public RPC providers frequently rate-limited the service
- **Inefficiency**: Re-querying immutable historical data every hour
- **Resource waste**: Unnecessary load on public infrastructure
- **Slow execution**: ~60 seconds per run due to rate limit delays

The incremental caching strategy solves these issues while maintaining full transparency and auditability.

## Cache Architecture

### Data Structure

The event cache is stored as a JSON file with the following structure:

```typescript
interface EventCache {
  version: string                      // Schema version (currently "1.0.0")
  lastQueriedBlock: number             // Last blockchain block queried
  lastQueriedTimestamp: string         // ISO timestamp of last query
  oldestEventBlock: number             // Oldest block in cache (7-day window start)
  events: {
    created: SerializedEventLog[]      // DisputeCrowdsourcerCreated events
    contributions: SerializedEventLog[] // DisputeCrowdsourcerContribution events
    completed: SerializedEventLog[]    // DisputeCrowdsourcerCompleted events
  }
  metadata: {
    totalEventsTracked: number         // Total events in cache
    cacheGeneratedAt: string           // ISO timestamp of cache generation
    blockchainSyncStatus: 'complete' | 'partial' | 'stale'
  }
}
```

Each event is serialized to minimize storage:

```typescript
interface SerializedEventLog {
  blockNumber: number                  // Block where event occurred
  transactionHash: string              // Transaction hash
  disputeCrowdsourcerAddress: string   // Dispute contract address
  marketAddress: string                // Market contract address
  args: Array<string | number>         // Event arguments (serialized)
  eventType: 'created' | 'contribution' | 'completed'
}
```

### Storage Location

**Cache file**: `cache/event-cache.json` (stored in `gh-pages` branch)

**Public URL**: `https://augur.net/cache/event-cache.json`

The cache is committed to the `gh-pages` branch for maximum transparency. Anyone can:
- View the current cache contents
- Audit the git history to see cache evolution
- Verify that cached data matches blockchain events

### Sliding Window Strategy

The cache maintains a 7-day sliding window of events:

```
Current Block: 19,123,456
7-day window:  19,123,456 - 50,400 = 19,073,056

Cache contains: All events from blocks 19,073,056 → 19,123,456
Older events: Automatically pruned on each run
```

This ensures:
- Relevant data is always available (disputes rarely last >7 days)
- Cache size remains bounded (~50KB, well under git size limits)
- No historical data bloat over time

## Incremental Update Strategy

### Query Optimization

On each run, the system:

1. **Loads cache** from `gh-pages` branch
2. **Validates cache** (version, integrity, block numbers)
3. **Determines query range**:
   - If cache is valid: Query only `lastQueriedBlock + 1 → currentBlock`
   - If cache is invalid/missing: Query full 7-day window
4. **Applies finality protection**: Re-query last 32 blocks regardless
5. **Merges** cached events with newly queried events
6. **Prunes** events older than 7 days
7. **Saves** updated cache

### Finality Protection

Ethereum blocks become "finalized" after ~32 blocks (~6.4 minutes). To handle chain reorganizations:

- The system **always re-queries the last 32 blocks**
- This ensures reorganized blocks are detected and corrected
- Cached events from re-queried blocks are discarded and replaced with fresh data

Example:
```
Last queried: Block 19,123,000
Current block: 19,123,456
Finality depth: 32 blocks

Query range: 19,123,000 - 32 = 19,122,968 → 19,123,456
(468 blocks instead of 50,400 blocks)
```

### Cache Validation

Before using cached data, the system validates:

- **Version compatibility**: Cache schema version matches current version
- **Required fields**: All mandatory fields are present
- **Block number sanity**: Block numbers are within reasonable bounds
- **Event count consistency**: Metadata matches actual event counts

If validation fails, the cache is discarded and a full 7-day query is performed.

## Smart Commit Strategy

To maintain clean git history, the system uses intelligent commit logic:

### Commit Types

| Commit Type | Trigger | Frequency | Example |
|-------------|---------|-----------|---------|
| **Immediate** | Risk data changes (new disputes, risk % change) | Variable (~10/month) | "chore: update fork risk data (2.1% → 2.7%)" |
| **Daily Cache** | Cache-only updates at midnight (00:05 UTC) | ~30/month | "chore: daily event cache refresh" |
| **Skip** | No meaningful changes | Majority of runs | No commit |

### Detection Logic

```bash
# Check what changed
RISK_DIFF=$(git diff --staged --numstat data/fork-risk.json | awk '{print $1+$2}')
CACHE_DIFF=$(git diff --staged --numstat cache/event-cache.json | awk '{print $1+$2}')

# Commit strategy
if [ "$RISK_DIFF" -gt 10 ]; then
  # Immediate: Meaningful risk change (not just timestamp)
  COMMIT_TYPE="immediate"
elif [ "$CACHE_DIFF" -gt 0 ] && [ "$(date +%H)" = "00" ]; then
  # Daily: Cache refresh at midnight
  COMMIT_TYPE="daily"
else
  # Skip: No meaningful changes
  COMMIT_TYPE="skip"
fi
```

### Expected Git History

**Before caching** (hourly execution):
- ~720 commits/month
- Most commits identical (no actual changes)
- Noisy history, hard to audit

**After caching** (6-hour execution with smart commits):
- ~40 commits/month
- ~10 risk changes (real dispute activity)
- ~30 daily cache refreshes
- Clean history, easy to track trends

## Performance Impact

### RPC Call Reduction

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Execution frequency** | Every hour | Every 6 hours | 75% reduction |
| **Blocks queried/run** | ~50,400 blocks | ~1,800 blocks (avg) | 96% reduction |
| **RPC queries/run** | ~51 queries | ~2 queries | 96% reduction |
| **Total queries/day** | ~1,200 | ~8 | **99.3% reduction** |
| **Execution time** | ~60 seconds | ~10 seconds | 83% reduction |

### Real-World Example

**Scenario**: Typical 6-hour period with no new disputes

```
Old approach (hourly):
- Runs: 6 times
- Blocks queried: 6 × 50,400 = 302,400 blocks
- RPC queries: 6 × 51 = 306 queries
- Execution time: 6 × 60s = 6 minutes total

New approach (6-hour with cache):
- Runs: 1 time
- Blocks queried: 1,800 blocks (incremental)
- RPC queries: 2 queries
- Execution time: 10 seconds

Improvement: 306 → 2 queries (99% reduction)
```

### Cache Efficiency Metrics

On each run, the system logs:

```
📦 Incremental query: blocks 19,122,968 → 19,123,456 (~488 blocks)
💾 Cache contains 1,827 events
New events found: 0
📦 Merged with cached events: total 1,827 events
💰 RPC queries saved: ~49 queries (queried 488 blocks instead of 50,400)
```

## Transparency & Auditability

### Public Visibility

1. **Cache is publicly accessible**:
   - URL: `https://augur.net/cache/event-cache.json`
   - Anyone can download and inspect

2. **Git history shows evolution**:
   - Command: `git log gh-pages -- cache/event-cache.json`
   - See exactly when cache was updated
   - Track event additions/removals

3. **GitHub Actions logs are public**:
   - View: Repository → Actions tab
   - See detailed query logs, RPC calls, and commit decisions
   - Full audit trail of all operations

### Verification Process

Users can verify cache accuracy:

```bash
# 1. Download cache
curl https://augur.net/cache/event-cache.json > cache.json

# 2. Check cache metadata
jq '.version, .lastQueriedBlock, .metadata' cache.json

# 3. Verify event count matches
EXPECTED=$(jq '.metadata.totalEventsTracked' cache.json)
ACTUAL=$(jq '(.events.created | length) + (.events.contributions | length) + (.events.completed | length)' cache.json)
echo "Expected: $EXPECTED, Actual: $ACTUAL"

# 4. Compare with blockchain (requires RPC access)
# Query same block range and verify events match
```

### Logging for Audit Trail

All cache operations are logged:

```
✓ Cache loaded from gh-pages
Cache size: 45231 bytes
Cache version: 1.0.0
Last queried block: 19,123,000
📦 Incremental query: blocks 19,122,968 → 19,123,456 (~488 blocks)
💾 Cache contains 1,827 events
Chunk query complete: 1/1 successful
New events found: 0 (0 created, 0 contributions, 0 completed)
📦 Merged with cached events: total 1,827 events
Pruned 3 old events (older than block 19,073,056)
✓ Cache saved: 1,824 events
💰 RPC queries saved: ~49 queries
```

## Failure Handling

### Recovery Scenarios

| Failure Type | Detection | Recovery Action | Impact |
|--------------|-----------|----------------|--------|
| **Cache file missing** | `git show` fails | Create empty cache, full 7-day query | One slow run, then back to normal |
| **Cache corrupted (invalid JSON)** | `JSON.parse` error | Discard cache, full 7-day query | One slow run, cache rebuilt |
| **Cache version mismatch** | `validateCache()` | Fall back to full query | One slow run, cache upgraded |
| **Cache very stale (>7 days)** | Check `lastQueriedTimestamp` | Treat as full query, rebuild | One slow run, cache refreshed |
| **gh-pages unavailable** | `git show` error | Use empty cache, full query | One slow run, cache created |
| **Event serialization fails** | Try-catch in loop | Skip failed event, log warning | Partial data loss, non-fatal |
| **Pruning removes all events** | Post-prune count check | Log info, continue | Valid for no-dispute periods |

### Graceful Degradation

All errors are non-fatal. If caching fails:
1. System falls back to full 7-day query (old behavior)
2. Detailed error logged for debugging
3. Fork risk calculation continues normally
4. Cache rebuilt on next successful run

Example error handling:

```typescript
try {
  const cache = await loadEventCache()
  if (!validateCache(cache)) {
    console.warn('Cache validation failed, performing full query')
    return createEmptyCache()
  }
  return cache
} catch (error) {
  console.warn(`Cache load error: ${error.message}`)
  return createEmptyCache() // Fall back to full query
}
```

## Limitations & Considerations

### Cache Size

**Current**: ~45KB per cache file
**Maximum estimated**: ~80KB (worst case with many disputes)

Git handles small JSON files efficiently. The cache will never exceed 100KB due to:
- 7-day sliding window (auto-pruning)
- Minimal serialization (only essential fields)
- Event deduplication during merging

### Git History Growth

**Before**: ~720 commits/month = ~8,640/year
**After**: ~40 commits/month = ~480/year

Cache commits are small (JSON diffs compress well). Annual history growth: ~20MB (negligible).

### Network Dependency

The system depends on:
1. **Blockchain access**: RPC endpoints must be available
2. **GitHub Pages**: For cache storage/retrieval
3. **Git**: For version control and history

All dependencies have fallback mechanisms (RPC endpoint rotation, full query if cache unavailable).

### Ethereum Finality Assumption

The system assumes Ethereum finalizes blocks within 32 blocks (~6.4 minutes). This is standard for post-merge Ethereum. If deep reorganizations occur (>32 blocks), cached data from reorganized blocks may be incorrect until the next run detects the discrepancy.

**Mitigation**: The 32-block finality depth is conservative. Most reorganizations are <10 blocks.

## Implementation Details

### Code Location

- **Cache interfaces**: `scripts/calculate-fork-risk.ts` (lines 62-87)
- **Cache functions**: `scripts/calculate-fork-risk.ts` (lines 349-511)
- **Incremental query logic**: `scripts/calculate-fork-risk.ts` (lines 513-695)
- **Workflow integration**: `.github/workflows/build-and-deploy.yml`

### Execution Flow

```
GitHub Actions (every 6 hours)
  ↓
Fetch cache from gh-pages
  ↓
npm run build:fork-data
  ↓
calculate-fork-risk.ts
  ├─ loadEventCache()
  ├─ Determine query range (incremental or full)
  ├─ Query blockchain (with finality protection)
  ├─ Merge cached + new events
  ├─ pruneOldEvents()
  └─ saveEventCache()
  ↓
Smart commit detection
  ├─ Immediate: Risk data changed → commit + push
  ├─ Daily: Midnight cache refresh → commit + push
  └─ Skip: No meaningful changes → no commit
  ↓
Deploy to gh-pages (if committed)
```

### Configuration

Key constants (in `scripts/calculate-fork-risk.ts`):

```typescript
const CACHE_VERSION = '1.0.0'        // Cache schema version
const FINALITY_DEPTH = 32            // Ethereum finality depth
const SEARCH_PERIOD = 7 * 7200       // 7 days in blocks
```

Workflow schedule (in `.github/workflows/build-and-deploy.yml`):

```yaml
schedule:
  - cron: '5 */6 * * *'  # Every 6 hours at :05
```

## References

### Related Documentation

- **[Fork Risk Assessment](./fork-risk-assessment.md)**: Methodology for calculating fork risk
- **[Technical Architecture](./technical-architecture.md)**: Frontend component architecture
- **[Augur Protocol Reference](./augur-protocol-reference.md)**: Augur v2 protocol mechanics

### External Resources

- **Ethereum Finality**: [ethereum.org/developers/docs/consensus-mechanisms/pos](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/)
- **Public RPC Endpoints**: [chainlist.org](https://chainlist.org/)
- **GitHub Actions Documentation**: [docs.github.com/actions](https://docs.github.com/en/actions)

---

**Questions or Issues?**
- View cache: [augur.net/cache/event-cache.json](https://augur.net/cache/event-cache.json)
- View git history: `git log gh-pages -- cache/event-cache.json`
- View GitHub Actions logs: Repository → Actions tab
- Report issues: GitHub repository issues
