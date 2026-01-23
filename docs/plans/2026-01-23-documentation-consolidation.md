# Documentation Consolidation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish single source of truth by removing gh-pages cache tier from workflow, consolidating documentation, and eliminating duplication across CLAUDE.md and docs.

**Architecture:**
- Workflow simplifies to GH Actions cache only (no gh-pages fallback or commits)
- fork-risk-monitoring-system.md becomes the authoritative system documentation (state-based, not phase-based)
- CLAUDE.md points to docs without repeating content
- Plan document is deleted after merging (historical artifact)

**Tech Stack:** GitHub Actions YAML, Markdown documentation

---

## Task 1: Remove gh-pages Cache Tier from Workflow

**Files:**
- Modify: `.github/workflows/build-and-deploy.yml:89-95` (remove gh-pages checkout)
- Modify: `.github/workflows/build-and-deploy.yml:106-138` (simplify cache comments and remove fallback)
- Modify: `.github/workflows/build-and-deploy.yml:220-231` (remove gh-pages commit from cache-rebuild)
- Modify: `.github/workflows/build-and-deploy.yml:255-271` (remove gh-pages cache commit from deploy)

**Step 1: Remove gh-pages checkout step from risk-monitor job**

Delete lines 89-95:
```yaml
      - name: Checkout gh-pages for cache
        uses: actions/checkout@v4
        with:
          ref: gh-pages
          path: gh-pages-cache
          sparse-checkout: cache
          sparse-checkout-cone-mode: false
```

**Step 2: Simplify cache comments and remove gh-pages fallback**

Replace lines 106-138 with simplified single-tier strategy:
```yaml
      # Cache restoration: GH Actions cache only
      # - Restores event-cache.json from GitHub Actions cache (persists ~7 days)
      # - On cache miss, creates empty cache and performs full 7-day query
      # - No git commits for cache - ephemeral by design

      - name: Restore event cache from GH Actions
        uses: actions/cache@v4
        with:
          path: public/cache/event-cache.json
          key: event-cache-${{ runner.os }}-${{ hashFiles('public/cache/event-cache.json') }}
          restore-keys: |
            event-cache-${{ runner.os }}-

      - name: Bootstrap empty cache if GH Actions cache miss
        run: |
          if [ ! -f public/cache/event-cache.json ]; then
            mkdir -p public/cache
            echo "⚠️ No cache found, will perform full 7-day query"
            NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
            jq -n '{version: "1.0.0", lastQueriedBlock: 0, lastQueriedTimestamp: "'$NOW'", oldestEventBlock: 0, events: {created: [], contributions: [], completed: []}, metadata: {totalEventsTracked: 0, cacheGeneratedAt: "'$NOW'", blockchainSyncStatus: "complete"}}' > public/cache/event-cache.json
          fi
```

**Step 3: Remove gh-pages commit from cache-rebuild job**

Delete lines 220-231 (the entire "Commit rebuilt cache to gh-pages if risk changed" step):
```yaml
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

**Step 4: Remove gh-pages cache commit from deploy job**

Delete lines 255-271 (checkout for cache commit and commit step):
```yaml
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

**Step 5: Verify workflow syntax**

Run: `cat .github/workflows/build-and-deploy.yml | head -300`

Expected: Clean YAML with no gh-pages references except for deploy-pages action

**Step 6: Commit**

```bash
git add .github/workflows/build-and-deploy.yml
git commit -m "chore: simplify cache to GH Actions only, remove gh-pages tier

- Remove gh-pages checkout and fallback logic from risk-monitor
- Remove gh-pages commits from cache-rebuild job
- Remove event-cache.json commits from deploy job
- Cache is now ephemeral (GH Actions only, no git persistence)"
```

---

## Task 2: Delete fork-risk-update-plan.md

**Files:**
- Delete: `docs/fork-risk-update-plan.md`

**Step 1: Remove the plan file**

Run: `rm docs/fork-risk-update-plan.md`

**Step 2: Verify deletion**

Run: `ls docs/*.md`

Expected: Should NOT include fork-risk-update-plan.md

**Step 3: Commit**

```bash
git add docs/fork-risk-update-plan.md
git commit -m "chore: remove completed Phase 2 plan document

Plan served its purpose during implementation. Documentation now
consolidated in fork-risk-monitoring-system.md as single source of truth."
```

---

## Task 3: Refactor fork-risk-monitoring-system.md to State-Based Documentation

**Files:**
- Modify: `docs/fork-risk-monitoring-system.md` (full rewrite)

**Step 1: Read current document structure**

Run: `grep -n "^## \|^### " docs/fork-risk-monitoring-system.md`

Review sections to understand what to keep, merge, or remove.

**Step 2: Rewrite document with state-based structure**

Replace entire file with this structure (key principles: describe current system, no phase references, code references instead of code blocks, complementary to fork-risk-assessment.md):

```markdown
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
```

**Step 3: Verify no overlap with fork-risk-assessment.md**

Run: `head -60 docs/fork-risk-assessment.md`

Confirm: assessment.md covers WHAT (formula, thresholds, data sources), monitoring.md covers HOW (workflow, cache, operations). No duplication.

**Step 4: Commit**

```bash
git add docs/fork-risk-monitoring-system.md
git commit -m "docs: rewrite fork-risk-monitoring-system.md as state-based documentation

- Remove phase-based language and change history
- Replace code blocks with file:line references
- Focus on current system architecture
- Complementary to fork-risk-assessment.md (no overlap)"
```

---

## Task 4: Update CLAUDE.md to Remove Duplicates

**Files:**
- Modify: `.claude/CLAUDE.md:38-39`

**Step 1: Read current Implementation Quirks section**

Run: `sed -n '36,42p' .claude/CLAUDE.md`

**Step 2: Remove duplicate fork risk content**

Replace lines 36-40:
```markdown
## Implementation Quirks

- **Astro Scoped Styles**: Component <style> blocks auto-scoped with data-astro-cid-* attributes. Use is:global for truly global styles.
- **Fork Risk Formula**: (Largest Dispute Bond / 275,000 REP) × 100 = Risk %. Smaller denominator would severely underestimate risk.
- **RPC Endpoint Failover**: Uses 4 public endpoints (LlamaRPC, LinkPool, PublicNode, 1RPC) with auto-fallback. No API keys needed.
```

With:
```markdown
## Implementation Quirks

- **Astro Scoped Styles**: Component <style> blocks auto-scoped with data-astro-cid-* attributes. Use is:global for truly global styles.
- **Fork Risk Details**: See `docs/fork-risk-assessment.md` (calculation) and `docs/fork-risk-monitoring-system.md` (operations).
```

**Step 3: Update Key Documentation References to be more concise**

Review lines 5-11 and simplify descriptions to be pointers, not summaries.

**Step 4: Verify CLAUDE.md is navigation-only**

Run: `cat .claude/CLAUDE.md`

Confirm: No formulas, no technical details repeated from docs. Only pointers and team workflow conventions.

**Step 5: Commit**

```bash
git add .claude/CLAUDE.md
git commit -m "chore: remove duplicate fork risk content from CLAUDE.md

CLAUDE.md is now navigation-only. Points to docs instead of
repeating formulas and implementation details."
```

---

## Task 5: Create Brief PR Summary

**Files:**
- None (PR description only)

**Step 1: Update PR #66 description with consolidated summary**

Run:
```bash
gh pr edit 66 --body "$(cat <<'EOF'
## Phase 2: Fork Risk Monitoring System - Complete Implementation

### Summary

Completes the fork risk monitoring system with:
- **Cache validation signal**: `cacheValidation.isHealthy` in fork-risk.json drives automatic rebuild decisions
- **Field cleanup**: Removed hourly-changing fields (timestamp, nextUpdate, calculation.method) that caused false git diffs
- **Semantic rename**: `lastUpdated` → `lastRiskChange` (clarity: "when did risk move?" not "when did we check?")
- **Warning logging**: GitHub Actions warnings for cache failures, RPC fallbacks, and rebuild triggers
- **Documentation consolidation**: Single source of truth in `docs/fork-risk-monitoring-system.md`

### Architecture

```
Hourly: risk-monitor job
  ├── Restore cache from GH Actions
  ├── Run incremental calculation
  ├── Validate cache (8-block requery)
  ├── Output: risk-changed, needs-rebuild
  └── Save cache to GH Actions

Event-driven: cache-rebuild job (if needs-rebuild=true)
  └── Full 7-day blockchain rescan
```

### Files Changed

| File | Change |
|------|--------|
| `src/types/gauge.ts` | Interface: add cacheValidation, remove timestamp/nextUpdate/method |
| `scripts/calculate-fork-risk.ts` | All 3 data paths updated, warning logging added |
| `.github/workflows/build-and-deploy.yml` | Phase 2 validation wired, gh-pages cache tier removed |
| `src/components/ForkDetailsCard.tsx` | Use lastRiskChange |
| `src/providers/ForkDataProvider.tsx` | Update defaults and format function |
| `docs/fork-risk-monitoring-system.md` | Consolidated system documentation |
| `.claude/CLAUDE.md` | Navigation-only, removed duplicates |

### Test Plan

- [x] `npm run typecheck` passes
- [x] `npm run lint` passes
- [x] `npm run build` succeeds
- [x] `npm run build:fork-data` generates correct JSON structure
- [x] fork-risk.json contains `cacheValidation.isHealthy`
- [x] No gh-pages cache references in workflow (except deploy-pages)
EOF
)"
```

**Step 2: Verify PR description updated**

Run: `gh pr view 66 --json body | jq -r '.body' | head -30`

---

## Task 6: Final Coherence Verification

**Files:**
- Read: `docs/fork-risk-assessment.md`
- Read: `docs/fork-risk-monitoring-system.md`
- Read: `.claude/CLAUDE.md`

**Step 1: Verify no duplication between assessment and monitoring docs**

Run: `grep -i "275.*000\|fork threshold\|risk.*formula" docs/fork-risk-monitoring-system.md`

Expected: No formula definitions (those belong in assessment.md). Only references like "See fork-risk-assessment.md".

**Step 2: Verify CLAUDE.md has no repeated content**

Run: `grep -i "formula\|RPC.*endpoint\|fallback" .claude/CLAUDE.md`

Expected: Only pointers to docs, no technical details.

**Step 3: Verify workflow has no gh-pages cache references**

Run: `grep -i "gh-pages" .github/workflows/build-and-deploy.yml`

Expected: Only the deploy-pages action reference, no cache checkout/commit steps.

**Step 4: Run full verification suite**

```bash
npm run typecheck && npm run lint && npm run build
```

Expected: All pass

**Step 5: Final commit (if any cleanup needed)**

```bash
git status
# If clean, proceed to merge
# If changes, commit with appropriate message
```

---

## Summary of Changes

| File | Purpose |
|------|---------|
| `.github/workflows/build-and-deploy.yml` | Simplified to GH Actions cache only |
| `docs/fork-risk-update-plan.md` | Deleted (served its purpose) |
| `docs/fork-risk-monitoring-system.md` | Rewritten as state-based single source of truth |
| `.claude/CLAUDE.md` | Navigation-only, no repeated content |

---

## Verification Checklist

- [ ] Workflow has no gh-pages cache tier (GH Actions only)
- [ ] fork-risk-update-plan.md deleted
- [ ] fork-risk-monitoring-system.md is state-based (no phase references)
- [ ] fork-risk-monitoring-system.md uses file:line references (no code blocks)
- [ ] fork-risk-assessment.md and monitoring.md are complementary (no overlap)
- [ ] CLAUDE.md points to docs without repeating content
- [ ] PR description is concise summary (not full plan)
- [ ] All verification commands pass (typecheck, lint, build)
