# Cache Architecture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate event cache from git commits to GitHub Actions storage, implement hourly monitoring with lightweight validation, add event-driven cache rebuilds, and update UI to show monitoring cadence.

**Architecture:** Two-job workflow (Risk Monitor every hour + event-driven Cache Rebuild) using GitHub Actions cache storage instead of git commits. Risk Monitor performs incremental queries with lightweight 8-block validation. Cache Rebuild runs only when validation detects corruption. UI displays "Monitored: Every hour" with tooltip showing last change timestamp.

**Tech Stack:** GitHub Actions (cache storage, workflow scheduling, concurrency), Astro 5.10+ (static build), React 19 (island components), TypeScript (dual runtime contexts), Tailwind v4 CSS, Nanostores (state management)

---

## Phase 1: Workflow Updates

### Task 1.1: Restructure workflow into two jobs with concurrency locking

**Files:**
- Modify: `.github/workflows/build-and-deploy.yml` (entire file restructure)

**Step 1: Understand current workflow structure**

Read current file to identify:
- Current triggers (schedule at 0 */6 * * *, workflow_dispatch, push, pull_request)
- Current jobs (build, deploy, summary)
- Cache loading logic (lines 51-77)
- Deployment logic (lines 78-214)

Expected: File has 3 jobs, ~220 lines

**Step 2: Create new risk-monitor job structure**

Replace the current `build` job with new `risk-monitor` job:

```yaml
  risk-monitor:
    runs-on: ubuntu-latest
    concurrency:
      group: fork-risk-cache
      cancel-in-progress: false
    permissions:
      contents: write
      pages: write
      id-token: write

    outputs:
      risk-changed: ${{ steps.check-risk.outputs.risk-changed }}
      needs-rebuild: ${{ steps.validate-cache.outputs.needs-rebuild }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Checkout gh-pages for cache
        uses: actions/checkout@v4
        with:
          ref: gh-pages
          path: gh-pages-cache
          sparse-checkout: cache
          sparse-checkout-cone: false

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Restore event cache from GH Actions
        uses: actions/cache@v4
        with:
          path: public/cache/event-cache.json
          key: event-cache-${{ runner.os }}-${{ hashFiles('public/cache/event-cache.json') }}
          restore-keys: |
            event-cache-${{ runner.os }}-

      - name: Fallback to cache from gh-pages if GH Actions cache miss
        run: |
          if [ ! -f public/cache/event-cache.json ]; then
            mkdir -p public/cache
            if [ -f gh-pages-cache/cache/event-cache.json ]; then
              cp gh-pages-cache/cache/event-cache.json public/cache/event-cache.json
              echo "✓ Cache loaded from gh-pages"
            else
              echo "⚠️ No cache found, will perform full 7-day query"
              NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
              jq -n '{version: "1.0.0", lastQueriedBlock: 0, lastQueriedTimestamp: "'$NOW'", oldestEventBlock: 0, events: {created: [], contributions: [], completed: []}, metadata: {totalEventsTracked: 0, cacheGeneratedAt: "'$NOW'", blockchainSyncStatus: "complete"}}' > public/cache/event-cache.json
            fi
          fi

      - name: Run incremental fork risk calculation
        id: calc-risk
        run: npm run build:fork-data
        env:
          ETH_RPC_URL: ${{ secrets.ETH_RPC_URL || '' }}
          CALCULATION_MODE: 'incremental'

      - name: Validate cache health
        id: validate-cache
        run: |
          # Run lightweight validation (8-block re-query)
          # This will be implemented in calculate-fork-risk.ts
          # Output: needs-rebuild=true/false
          echo "needs-rebuild=false" >> $GITHUB_OUTPUT

      - name: Check if risk percentage changed
        id: check-risk
        run: |
          if [ -f public/data/fork-risk.json ]; then
            NEW_RISK=$(jq -r '.riskPercentage' public/data/fork-risk.json)
            # Compare with last committed version (with 0.01% tolerance)
            # If different: risk-changed=true, else false
            echo "risk-changed=true" >> $GITHUB_OUTPUT
          else
            echo "risk-changed=false" >> $GITHUB_OUTPUT
          fi

      - name: Save event cache to GH Actions
        uses: actions/cache@v4
        with:
          path: public/cache/event-cache.json
          key: event-cache-${{ runner.os }}-${{ hashFiles('public/cache/event-cache.json') }}
```

**Step 3: Create new cache-rebuild job (event-driven)**

Add new `cache-rebuild` job after `risk-monitor`:

```yaml
  cache-rebuild:
    runs-on: ubuntu-latest
    needs: risk-monitor
    if: needs.risk-monitor.outputs.needs-rebuild == 'true'
    concurrency:
      group: fork-risk-cache
      cancel-in-progress: false
    permissions:
      contents: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Run full cache rebuild (7-day rescan)
        run: npm run build:fork-data
        env:
          ETH_RPC_URL: ${{ secrets.ETH_RPC_URL || '' }}
          CALCULATION_MODE: 'full-rebuild'

      - name: Commit rebuilt cache to gh-pages if risk changed
        run: |
          git config user.email "github-actions@github.com"
          git config user.name "GitHub Actions"

          if git diff --quiet public/data/fork-risk.json; then
            echo "No risk change after rebuild, skipping commit"
          else
            git add public/data/fork-risk.json
            git commit -m "cache: rebuild event cache from full 7-day rescan"
            git push
          fi
```

**Step 4: Update deploy job to use risk-monitor output**

Modify `deploy` job to depend on `risk-monitor` and commit only on risk changes:

```yaml
  deploy:
    needs: risk-monitor
    if: github.ref == 'refs/heads/main' && (github.event_name == 'push' || github.event_name == 'workflow_dispatch' || github.event_name == 'schedule')
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: pages

      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4

      - name: Checkout for cache commit
        uses: actions/checkout@v4
        with:
          ref: gh-pages

      - name: Commit cache to gh-pages only if risk changed
        if: needs.risk-monitor.outputs.risk-changed == 'true'
        run: |
          git config user.email "github-actions@github.com"
          git config user.name "GitHub Actions"

          # Cache update logic - only commit if risk % changed
          if [ -f cache/event-cache.json ]; then
            git add cache/event-cache.json
            git commit -m "cache: update event cache (risk change detected)"
            git push
          fi
```

**Step 5: Update schedule to hourly**

Modify the schedule trigger:

```yaml
on:
  schedule:
    - cron: '0 * * * *'  # Every hour on the hour (was: 0 */6 * * *)
  workflow_dispatch:
    inputs:
      eth_rpc_url:
        description: 'Custom Ethereum RPC URL (optional)'
        required: false
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
```

**Step 6: Run workflow syntax check**

Run: `gh workflow validate .github/workflows/build-and-deploy.yml`
Expected: No syntax errors

**Step 7: Commit workflow changes**

```bash
git add .github/workflows/build-and-deploy.yml
git commit -m "refactor: restructure workflow into risk-monitor and cache-rebuild jobs with hourly schedule"
```

---

### Task 1.2: Add GitHub Actions cache restore logic

**Files:**
- Modify: `.github/workflows/build-and-deploy.yml` (risk-monitor job, cache restore steps)

**Step 1: Verify cache restore action is correct**

The `actions/cache@v4` step in risk-monitor job (added in Task 1.1) already handles:
- Restore from cache key (using file hash)
- Fallback to `restore-keys` pattern
- Save to same key after calculation

This is sufficient. Cache persists between runs, auto-clears if >7 days inactive.

**Step 2: Add cache fallback documentation**

Add comment explaining fallback chain in workflow:

```yaml
      # Cache restoration order:
      # 1. GH Actions cache (fastest, persists between runs)
      # 2. gh-pages branch (fallback if GH Actions cleared)
      # 3. Full 7-day query (cold start if both unavailable)
```

**Step 3: Commit**

```bash
git add .github/workflows/build-and-deploy.yml
git commit -m "docs: add cache restoration strategy comments"
```

---

## Phase 2: Script Updates

### Task 2.1: Add lightweight validation function to calculate-fork-risk.ts

**Files:**
- Modify: `scripts/calculate-fork-risk.ts` (add validation logic)

**Step 1: Read calculate-fork-risk.ts to understand current structure**

Read lines 1-100 to understand:
- Constants (FINALITY_DEPTH, RPC endpoints, etc.)
- EventCache interface
- Risk calculation logic

Expected: Understand the entry point and major functions

**Step 2: Add VALIDATION_DEPTH constant**

Add after line ~25 (where other constants defined):

```typescript
// Lightweight validation: re-query this many blocks to detect reorg-induced cache corruption
const VALIDATION_DEPTH = 8; // blocks (detects corruption within ~2 minutes)
```

**Step 3: Create validateCacheHealth() function**

Add before `main()` function (around line 800):

```typescript
/**
 * Lightweight cache validation: Re-query last N blocks fresh (without cache)
 * and compare against cached disputes in those blocks.
 *
 * Returns: { isHealthy: boolean, discrepancy?: string }
 * - isHealthy=true: Fresh data matches cache (cache is clean)
 * - isHealthy=false: Mismatch detected (cache corrupted, rebuild needed)
 */
async function validateCacheHealth(cache: EventCache): Promise<{ isHealthy: boolean; discrepancy?: string }> {
  try {
    if (!cache.lastQueriedBlock || cache.lastQueriedBlock === 0) {
      // No cached data to validate yet
      return { isHealthy: true };
    }

    const currentBlock = await getBlockNumber();
    const validationStartBlock = Math.max(
      cache.lastQueriedBlock - VALIDATION_DEPTH,
      0
    );

    console.log(
      `[Validation] Re-querying blocks ${validationStartBlock} to ${currentBlock} fresh (without cache)`
    );

    // Fresh query of last VALIDATION_DEPTH blocks
    const freshDisputesCreated = await queryEvents(
      'DisputeCrowdsourcerCreated',
      validationStartBlock,
      currentBlock,
      false // Don't use cache
    );

    const freshDisputesContributed = await queryEvents(
      'DisputeCrowdsourcerContribution',
      validationStartBlock,
      currentBlock,
      false // Don't use cache
    );

    const freshDisputesCompleted = await queryEvents(
      'DisputeCrowdsourcerCompleted',
      validationStartBlock,
      currentBlock,
      false // Don't use cache
    );

    // Extract dispute IDs from fresh query
    const freshDisputeIds = new Set<string>();
    for (const event of freshDisputesCreated) {
      freshDisputeIds.add(event.address); // or appropriate dispute identifier
    }

    // Extract cached dispute IDs from last VALIDATION_DEPTH blocks
    const cachedDisputeIds = new Set<string>();
    for (const event of cache.events.created) {
      if (event.blockNumber >= validationStartBlock) {
        cachedDisputeIds.add(event.address);
      }
    }

    // Compare
    if (freshDisputeIds.size !== cachedDisputeIds.size) {
      return {
        isHealthy: false,
        discrepancy: `Block count mismatch: fresh=${freshDisputeIds.size}, cached=${cachedDisputeIds.size}`,
      };
    }

    // Check if IDs match
    for (const id of freshDisputeIds) {
      if (!cachedDisputeIds.has(id)) {
        return {
          isHealthy: false,
          discrepancy: `Dispute ${id} in fresh query but not in cache`,
        };
      }
    }

    console.log('[Validation] ✓ Cache is healthy (fresh data matches cache)');
    return { isHealthy: true };
  } catch (error) {
    console.error('[Validation] Error during cache validation:', error);
    // If validation fails, we can't trust the result - treat as if cache needs rebuild
    return {
      isHealthy: false,
      discrepancy: `Validation error: ${error instanceof Error ? error.message : 'unknown'}`,
    };
  }
}
```

**Step 4: Update main() to call validation**

Modify the `main()` function (around line 850) to add validation check:

```typescript
async function main() {
  try {
    // ... existing load cache logic ...
    const cache = loadEventCache();

    // Determine calculation mode from environment
    const mode = process.env.CALCULATION_MODE || 'incremental';

    if (mode === 'full-rebuild') {
      console.log('[Mode] FULL REBUILD - ignoring cache, performing complete 7-day rescan');
      // Skip validation, perform full query
    } else {
      // INCREMENTAL MODE (default)
      // Run lightweight validation before proceeding
      const validation = await validateCacheHealth(cache);

      if (!validation.isHealthy) {
        console.warn('[Validation] ✗ Cache health check failed:', validation.discrepancy);
        console.warn('[Validation] Signaling Cache Rebuild job to run...');

        // Signal to GitHub Actions that rebuild is needed
        // This will be read by workflow's validate-cache step
        if (process.env.GITHUB_OUTPUT) {
          fs.appendFileSync(process.env.GITHUB_OUTPUT, 'needs-rebuild=true\n');
        }

        console.log('[Validation] Continuing with current (possibly corrupted) cache for this run');
      }
    }

    // ... rest of existing main logic ...

    // Save cache
    saveEventCache(cache);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}
```

**Step 5: Update queryEvents() to support cache-bypass**

Modify `queryEvents()` function signature (around line 500) to accept cache-bypass parameter:

```typescript
async function queryEvents(
  eventName: string,
  fromBlock: number,
  toBlock: number,
  useCache: boolean = true // New parameter, default true for backward compatibility
): Promise<SerializedEventLog[]> {
  // If useCache=false, skip all cache logic and query fresh
  if (!useCache) {
    console.log(`[Query] ${eventName} blocks ${fromBlock}-${toBlock} (fresh, no cache)`);
    // Query directly without cache logic
    // ... existing query code, but skip cache merge step ...
  } else {
    // Existing incremental query logic with cache
    // ...
  }
}
```

**Step 6: Test validation function locally**

Create a test to verify validation catches mismatches:

Run: `npm run build:fork-data`
Expected: Script runs, validation passes (if cache is healthy)

**Step 7: Commit**

```bash
git add scripts/calculate-fork-risk.ts
git commit -m "feat: add lightweight cache validation (8-block re-query)"
```

---

### Task 2.2: Update script to use CALCULATION_MODE environment variable

**Files:**
- Modify: `scripts/calculate-fork-risk.ts` (update main() function)

**Step 1: Add mode detection in main()**

At start of `main()` function:

```typescript
const mode = process.env.CALCULATION_MODE || 'incremental';

if (mode === 'full-rebuild') {
  console.log('[Mode] FULL REBUILD - performing complete 7-day rescan');
  // Set flag to ignore cache during event query
} else if (mode === 'incremental') {
  console.log('[Mode] INCREMENTAL - querying only new blocks since last update');
}
```

**Step 2: Update event query logic**

Where events are queried (around line 520):

```typescript
let startBlock: number;

if (mode === 'full-rebuild' || !cache.lastQueriedBlock || cache.lastQueriedBlock === 0) {
  // Full 7-day rescan
  startBlock = Math.max(currentBlock - 50400, 0); // 50,400 blocks = ~7 days
  console.log(`[Query] Full 7-day rescan: blocks ${startBlock} to ${currentBlock}`);
} else {
  // Incremental: only new blocks since last query
  startBlock = Math.max(cache.lastQueriedBlock - FINALITY_DEPTH, 0);
  console.log(`[Query] Incremental: blocks ${startBlock} to ${currentBlock}`);
}

// Query events starting from calculated block
const newEvents = await queryEvents('DisputeCrowdsourcerCreated', startBlock, currentBlock);
```

**Step 3: Test both modes**

Run incremental:
```bash
CALCULATION_MODE=incremental npm run build:fork-data
```
Expected: Quick execution (~2-3 RPC calls)

Run full rebuild:
```bash
CALCULATION_MODE=full-rebuild npm run build:fork-data
```
Expected: Slower execution (~150 RPC calls), full 7-day data

**Step 4: Commit**

```bash
git add scripts/calculate-fork-risk.ts
git commit -m "feat: add CALCULATION_MODE environment variable for incremental vs full rebuild"
```

---

### Task 2.3: Ensure lastUpdated timestamp is always included in fork-risk.json

**Files:**
- Modify: `scripts/calculate-fork-risk.ts` (output serialization)

**Step 1: Verify lastUpdated is included in output**

Read output serialization section (around line 750):

```typescript
const output: ForkRiskData = {
  timestamp: new Date().toISOString(),
  blockNumber: currentBlock,
  riskLevel: riskLevel,
  riskPercentage: riskPercentage,
  // ... other fields ...
};
```

**Step 2: Add lastUpdated if missing**

Modify to include `lastUpdated`:

```typescript
const output: ForkRiskData = {
  timestamp: new Date().toISOString(),
  lastUpdated: new Date().toISOString(), // NEW: Always include
  blockNumber: currentBlock,
  riskLevel: riskLevel,
  riskPercentage: riskPercentage,
  // ... rest of fields ...
};
```

**Step 3: Update ForkRiskData interface in types if needed**

Check `src/types/gauge.ts` to ensure `lastUpdated` field exists:

If missing, add to interface:

```typescript
interface ForkRiskData {
  timestamp: string;
  lastUpdated: string; // NEW: ISO timestamp of when risk was last recalculated
  blockNumber?: number;
  // ... rest of fields ...
}
```

**Step 4: Test output**

Run: `npm run build:fork-data`
Expected: Output `public/data/fork-risk.json` contains `lastUpdated` field

**Step 5: Commit**

```bash
git add scripts/calculate-fork-risk.ts src/types/gauge.ts
git commit -m "feat: ensure lastUpdated timestamp always included in fork-risk.json"
```

---

## Phase 3: UI Component Updates

### Task 3.1: Update ForkDisplay component to show monitoring cadence

**Files:**
- Modify: `src/components/ForkDisplay.tsx` (replace timestamp display)

**Step 1: Read current ForkDisplay.tsx**

Understand:
- Current timestamp display logic
- Where `lastUpdated` is rendered
- Component props and state

**Step 2: Add monitoring cadence message**

Replace timestamp section with:

```typescript
// In render section, replace old timestamp display with:
<div className="text-center text-sm text-gray-400">
  <span>Monitored: Every hour</span>
  <button
    className="ml-2 inline-block cursor-help text-xs underline hover:text-gray-300"
    title={`Last changed: ${formatRelativeTime(rawData.lastUpdated)}`}
  >
    ℹ️
  </button>
</div>
```

**Step 3: Add helper function formatRelativeTime()**

Add at bottom of component file:

```typescript
function formatRelativeTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}
```

**Step 4: Test in development**

Run: `npm run dev`
Expected: "Monitored: Every hour" displays with ℹ️ button, hover shows tooltip

**Step 5: Commit**

```bash
git add src/components/ForkDisplay.tsx
git commit -m "feat: replace timestamp with monitoring cadence display"
```

---

### Task 3.2: Add tooltip component for last changed time

**Files:**
- Modify: `src/components/ForkDisplay.tsx` (add tooltip logic)
- Create: `src/components/MonitoringTooltip.tsx` (optional, if using component)

**Step 1: Decide on tooltip implementation**

Check if shadcn/ui has Tooltip component or use native title attribute.

Read: `src/components/ui/` to see available components

**Step 2: If using shadcn Tooltip**

If Tooltip exists, import and use:

```typescript
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// In render:
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <button className="ml-2 inline-block text-xs underline">ℹ️</button>
    </TooltipTrigger>
    <TooltipContent>
      Last changed: {formatRelativeTime(rawData.lastUpdated)}
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

**Step 3: If using native title**

Use native HTML title attribute (simpler, already in Step 3.1):

```typescript
<button
  className="ml-2 inline-block cursor-help text-xs underline hover:text-gray-300"
  title={`Last changed: ${formatRelativeTime(rawData.lastUpdated)}`}
>
  ℹ️
</button>
```

**Step 4: Test tooltip**

Run: `npm run dev`
Navigate to page and hover over ℹ️ button
Expected: Tooltip shows "Last changed: X ago"

**Step 5: Commit**

```bash
git add src/components/ForkDisplay.tsx
git commit -m "feat: add tooltip showing when fork risk last changed"
```

---

### Task 3.3: Update ForkDataProvider to parse lastUpdated from JSON

**Files:**
- Modify: `src/providers/ForkDataProvider.tsx` (ensure lastUpdated is available)

**Step 1: Read ForkDataProvider.tsx**

Understand:
- How data is loaded from fork-risk.json
- How data is exposed to components
- Current timestamp handling

**Step 2: Ensure lastUpdated is passed through**

In data loading section:

```typescript
// When parsing fork-risk.json:
const forkData: ForkRiskData = {
  ...jsonData,
  lastUpdated: jsonData.lastUpdated || jsonData.timestamp, // Fallback to timestamp if missing
};

// Expose in context value:
const contextValue = {
  lastUpdated: forkData.lastUpdated,
  // ... other fields ...
};
```

**Step 3: Update useForkData() hook return type**

Ensure hook exposes lastUpdated:

```typescript
return {
  gaugeData: {
    percentage: forkData.riskPercentage,
    repStaked: forkData.metrics.largestDisputeBond,
    activeDisputes: forkData.metrics.activeDisputes,
  },
  riskLevel: forkData.riskLevel,
  lastUpdated: forkData.lastUpdated, // NEW
  isLoading,
  error,
  rawData: forkData,
  setData,
  refetch,
};
```

**Step 4: Verify types match**

Check `src/types/gauge.ts` to ensure `ForkRiskData` interface includes `lastUpdated`

**Step 5: Test data flow**

Run: `npm run dev`
Open browser console and check that `lastUpdated` is available in context

**Step 6: Commit**

```bash
git add src/providers/ForkDataProvider.tsx
git commit -m "feat: expose lastUpdated timestamp in ForkDataProvider"
```

---

## Phase 4: Validation & Testing

### Task 4.1: Manual workflow dry-run test

**Files:**
- Testing via GitHub Actions UI

**Step 1: Push current changes to feature branch**

```bash
git push origin feature/risk-workflow-rework
```

**Step 2: Trigger risk-monitor job manually**

Via GitHub UI:
- Go to Actions tab
- Select workflow: "Build and Deploy"
- Click "Run workflow" button
- Select branch: `feature/risk-workflow-rework`
- Click green "Run workflow" button

Expected: Workflow starts

**Step 3: Monitor risk-monitor job**

Expected outputs:
- ✓ Checkout succeeds
- ✓ Node setup succeeds
- ✓ Cache restore succeeds (or falls back to gh-pages)
- ✓ Fork risk calculation completes (~10-30 seconds for incremental, ~2-3 minutes for full rebuild)
- ✓ Cache validation passes (no corruption detected)
- ✓ Risk percentage calculated and logged
- ✓ Cache saved to GH Actions

**Step 4: Check workflow outputs**

Verify outputs file contains:
- `risk-changed`: true/false
- `needs-rebuild`: true/false

**Step 5: Verify cache was saved**

- GH Actions cache should have new key with updated hash
- `public/data/fork-risk.json` should exist in workflow artifacts

**Step 6: Document results**

Expected success criteria:
- ✓ Workflow completes without errors
- ✓ RPC calls logged in output (should be 2-3 for incremental)
- ✓ fork-risk.json generated with lastUpdated field
- ✓ Cache validation passed

---

### Task 4.2: Test UI display with new data format

**Files:**
- Testing locally with npm run dev

**Step 1: Start dev server**

```bash
npm run dev
```

Expected: Server starts on http://localhost:4321

**Step 2: Navigate to homepage**

Visit: http://localhost:4321

Expected: Page loads, fork risk displays

**Step 3: Verify monitoring cadence display**

Expected: Text shows "Monitored: Every hour" (not timestamp)

**Step 4: Hover over tooltip indicator**

Expected: Tooltip shows "Last changed: X ago"

**Step 5: Check browser console**

Expected: No errors, `lastUpdated` field present in context

**Step 6: Test with different time differences**

Manually update `public/data/fork-risk.json` timestamp to test relative time formatting:
- 5 minutes ago: "5 minutes ago"
- 2 hours ago: "2 hours ago"
- 3 days ago: "3 days ago"

Expected: formatRelativeTime() works correctly

---

### Task 4.3: Test hourly schedule trigger (24-hour observation)

**Files:**
- GitHub Actions workflow (no file changes, observation only)

**Step 1: Merge to main branch**

```bash
git checkout main
git pull origin main
git merge feature/risk-workflow-rework
git push origin main
```

**Step 2: Monitor workflow for 24 hours**

- GitHub Actions tab will show hourly workflow runs
- Each run should complete in ~30-60 seconds
- No failures expected

**Step 3: Verify commit frequency**

Expected: Only commits when risk percentage changes
- If no risk changes: 0 commits in 24 hours
- If risk changes: 1-2 commits in 24 hours

**Step 4: Check RPC budget**

Estimate from logs:
- Should be ~50-60 RPC calls/day (24 hours × 2-3 calls/hour)
- No spikes or unexpected patterns

**Step 5: Verify cache hit rate**

From logs:
- Every run should increment from cache (incremental queries)
- Cache hit rate should be 100%

**Step 6: Document observations**

Create file: `docs/testing/2026-01-21-cache-architecture-testing-log.md`

Include:
- Run times (should be consistent ~30-60 seconds)
- RPC call counts per hour
- Commit frequency
- Any errors or warnings
- Cache health validation results (should all pass)

---

### Task 4.4: Test cache corruption detection and rebuild trigger

**Files:**
- Testing via manual corruption scenario

**Step 1: Manually corrupt cache**

On gh-pages branch, edit `cache/event-cache.json`:

```bash
git checkout gh-pages
# Edit cache/event-cache.json - change a dispute ID to trigger validation failure
# Save and commit
git commit -am "test: simulate cache corruption"
git push origin gh-pages
```

**Step 2: Trigger risk-monitor manually**

Via GitHub Actions UI, run workflow

Expected:
- Validation detects mismatch
- Workflow output sets `needs-rebuild=true`
- Cache Rebuild job automatically starts after Monitor completes

**Step 3: Monitor Cache Rebuild job**

Expected:
- Cache Rebuild runs full 7-day rescan
- Takes ~2-3 minutes (150 RPC calls)
- Completes successfully
- Logs show cache was rebuilt from scratch

**Step 4: Verify cache corrected**

After rebuild:
- Cache should be healthy again
- Next Monitor run should pass validation

**Step 5: Next Monitor run (automatic after rebuild)**

Expected:
- Monitor runs on schedule
- Validation passes (cache now healthy)
- No automatic rebuild triggered

**Step 6: Clean up test**

```bash
git checkout gh-pages
git revert HEAD  # Revert corruption test commit
git push origin gh-pages
```

---

### Task 4.5: Test concurrency locking behavior

**Files:**
- Testing via manual workflow dispatch

**Step 1: Start risk-monitor manually**

Via GitHub Actions UI, trigger workflow

Let it run for 30 seconds (should still be running)

**Step 2: While Monitor is running, manually trigger Cache Rebuild**

Via GitHub Actions UI:
- Go to Workflows
- Select manual trigger for cache-rebuild
- Click "Run workflow"

Expected: Cache Rebuild job created but **queued** (not running simultaneously)

**Step 3: Monitor both jobs**

Expected flow:
1. Monitor job continues running
2. Rebuild job shows "Queued" status
3. Monitor completes (~60 seconds)
4. Rebuild starts immediately after
5. Both complete without conflicts

**Step 4: Verify no simultaneous writes**

Check logs:
- No "file locked" errors
- No cache corruption from concurrent access
- Both jobs complete successfully

**Step 5: Document concurrency behavior**

Expected: Concurrency group `fork-risk-cache` prevents simultaneous cache writes

---

## Summary of Implementation

**Key Deliverables:**

1. ✓ Two-job workflow (Risk Monitor + Cache Rebuild) with concurrency locking
2. ✓ Hourly schedule replacing 6-hourly
3. ✓ GitHub Actions cache storage replacing git commits
4. ✓ Lightweight 8-block validation with automatic rebuild trigger
5. ✓ Script supports both incremental and full-rebuild modes
6. ✓ UI displays "Monitored: Every hour" with tooltip
7. ✓ lastUpdated timestamp always included in output
8. ✓ All validation tests passing
9. ✓ RPC budget ~50 calls/day verified

**Expected Outcomes:**

- Clean git history (commits only on risk changes)
- Hourly monitoring visible in UI
- Automatic cache corruption detection and repair
- Minimal RPC usage with incremental queries
- Transparent, auditable monitoring cadence

---

**Status:** Plan complete - Ready for implementation

**Next Step:** Use `superpowers:executing-plans` or `superpowers:subagent-driven-development` to implement tasks 1-4
