---
title: Fork Monitoring Pipeline
tags: [fork-monitoring, github-actions, pipeline]
---

# Fork Monitoring Pipeline

> The CI/CD pipeline that runs the fork monitor hourly, caches state, and deploys results.
> For what the monitor calculates, see [[fork-monitoring-methodology]]. For the protocol mechanics, see [[fork-mechanics]].

---

## Overview

| Aspect | Value |
|--------|-------|
| Frequency | Hourly (`0 * * * *`) + push to main + manual trigger |
| Architecture | Three-job pipeline: `risk-monitor` → `build` → `deploy` |
| Concurrency | Top-level group `fork-risk-pipeline`, queued not cancelled |
| Data integrity | Fail the build if fork-risk data is missing |

---

## Pipeline

```
risk-monitor          →  build              →  deploy
(calculate risk)         (build site)          (deploy to Pages)
     │                      │                      │
     │  upload artifact     │                      │
     ├──────────────────────┤                      │
     │                      │  upload Pages        │
     │                      ├──────────────────────┤
     │  save cache          │                      │
     ├──────────┐           │                      │
     │          cache       │                      │
```

### risk-monitor (always runs)

1. Shallow checkout (`fetch-depth: 1`)
2. Restore the newest `event-cache-v2-*` checkpoint from `actions/cache`
3. Run `scripts/calculate-fork-risk.ts`
4. Verify that the script updated the cache during the current run
5. Upload `fork-risk.json` as artifact (`fork-risk-data`)
6. On `main`, save the updated cache under a unique key for the next run

### build (always runs, needs: risk-monitor)

1. Shallow checkout
2. Download `fork-risk-data` artifact
3. **Verify `fork-risk.json` exists** — fail if missing
4. Type check, lint, build Astro site
5. Upload Pages artifact

### deploy (main branch only, needs: risk-monitor + build)

1. Download `github-pages` artifact
2. Deploy to GitHub Pages

---

## Workflow Triggers

| Trigger | risk-monitor | build | deploy |
|---------|-------------|-------|--------|
| Schedule (hourly) | ✓ | ✓ | ✓ (main only) |
| Push to main | ✓ | ✓ | ✓ |
| PR to main | ✓ | ✓ | ✗ |
| `workflow_dispatch` | ✓ | ✓ | ✓ (main only) |

---

## No Bootstrap Fallback

If the artifact is missing from `risk-monitor`, the build fails. No fake data is created. No `continue-on-error`.

**Rationale**: A bootstrap file with `riskLevel: "none"` would claim the monitor checked and found no disputes — but it actually couldn't check. Worse, GitHub Pages serves the *previous deploy's* `fork-risk.json` if the current build omits it, so stale data would persist silently. Failing the build is honest: the site stays on the last good deploy, and the "last updated" timestamp shows staleness.

For first-ever deploys, the site doesn't exist until `risk-monitor` succeeds at least once.

---

## Cache Strategy

```yaml
- uses: actions/cache/restore@v5
  with:
    path: public/cache/event-cache.json
    key: event-cache-v2-${{ github.run_id }}-${{ github.run_attempt }}
    restore-keys: |
      event-cache-v2-
      event-cache-v1

# calculate and validate the updated cache

- if: github.ref == 'refs/heads/main'
  uses: actions/cache/save@v5
  with:
    path: public/cache/event-cache.json
    key: event-cache-v2-${{ github.run_id }}-${{ github.run_attempt }}
```

GitHub Actions cache entries are immutable, so every successful `main` run saves its updated checkpoint under a key unique to the workflow run and attempt. The stable `event-cache-v2-` restore prefix selects the most recently created matching checkpoint. The legacy `event-cache-v1` restore key bootstraps the first v2 run without discarding its tracked history. Pull requests can restore the default-branch checkpoint, but only trusted `main` runs save an update.

### Why not `hashFiles`

The previous workflow used `event-cache-${{ runner.os }}-${{ hashFiles('public/cache/event-cache.json') }}`. Since the script updates tracked markets every run, the file hash changed every run and created a new cache entry each time. It was replaced by the static `event-cache-v1` key, but that key froze the first saved snapshot because existing GitHub Actions caches cannot be changed. The `event-cache-v2-<run-id>-<attempt>` strategy makes that rotation intentional and restores the newest checkpoint through a stable prefix.

### Cold start (cache evicted)

When the cache is missing, the script performs a 30-day event scan (~7 minutes, ~835 RPC calls). The seed file supplies the known-market baseline. A successful `main` run saves the resulting warm checkpoint for later runs.

When the universe is already forking, the calculation does not need to scan dispute events. It still refreshes and writes the restored checkpoint so the workflow can validate and carry that state forward without replacing it with an empty cache.

### Retention

The hourly schedule creates about 168 checkpoints per week, plus any successful `main` push or manual runs. GitHub removes cache entries that have not been accessed in over seven days and evicts least-recently-accessed entries when the repository reaches its cache storage limit. Because restoration selects only the newest matching checkpoint, older event-cache entries naturally age out.

---

## Concurrency

```yaml
concurrency:
  group: fork-risk-pipeline
  cancel-in-progress: false
```

Top-level group for the entire workflow. Prevents:
- **Duplicate artifacts** — two runs producing separate `github-pages` artifacts (caused a deploy failure on the old workflow)
- **Cache races** — two runs writing to the cache simultaneously
- Queues rather than cancels — preserves data integrity

---

## Failure Handling

| Scenario | Result |
|----------|--------|
| RPC endpoint down | Script auto-falls back to next endpoint |
| All RPC endpoints fail | Script fails → pipeline stops → retry next hour |
| Cache missing | 30-day scan + seed file; successful `main` job saves a warm checkpoint |
| Cache not updated during calculation | Validation fails → no artifact upload, cache save, build, or deploy |
| Artifact missing in build | Build fails → no deploy → site stays on last good version |
| Workflow failure | No deploy; retry on the next scheduled run |

---

## RPC Cost

| Mode | Calls | Time |
|------|-------|------|
| Incremental (warm cache) | ~175 | ~30 seconds |
| Cold start (cache evicted) | ~835 | ~7 minutes |
| Daily (24 incremental runs) | ~4,200 at ~175 calls/run | Estimate; actual usage varies with block range and tracked markets |

---

## Code References

| Component | Location |
|-----------|----------|
| Workflow | `.github/workflows/build-and-deploy.yml` |
| Calculation script | `scripts/calculate-fork-risk.ts` |
| Diagnostic probe | `scripts/probe-fork-state.ts` |
| Seed file | `public/data/dispute-markets-seed.json` |
| Contract configuration | `scripts/augur-contracts.json` |
| Data provider | `src/features/fork-monitor/data-provider.tsx` |
| Gauge display | `src/features/fork-monitor/gauge.tsx` |

---

## Cross-References

- [[fork-monitoring-methodology]] — how the calculation script works
- [[fork-mechanics]] — what the monitor is measuring
- [[technical-architecture]] — the Astro/React site architecture
