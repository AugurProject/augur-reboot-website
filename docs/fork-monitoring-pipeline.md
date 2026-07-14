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
2. Restore event cache from `actions/cache`
3. Run `scripts/calculate-fork-risk.ts`
4. Cache auto-saves after the step
5. Upload `fork-risk.json` as artifact (`fork-risk-data`)

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
- uses: actions/cache@v5
  with:
    path: public/cache/event-cache.json
    key: event-cache-v1
```

**Static key**: always overwrites the same entry. No proliferation of cache entries.

### Why not `hashFiles`

The previous workflow used `event-cache-${{ runner.os }}-${{ hashFiles('public/cache/event-cache.json') }}`. Since the script updates tracked markets every run, the file hash changes every run, creating a new cache entry each time. The repo accumulated 148+ entries. A static key keeps it to one.

### Cold start (cache evicted)

When the cache is missing, the script performs a 30-day event scan (~7 minutes, ~835 RPC calls). The seed file ensures no markets are missed. The cache is warm for the next run.

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
| Cache missing | 30-day scan + seed file, warm cache for next run |
| Artifact missing in build | Build fails → no deploy → site stays on last good version |
| Workflow failure | Cache unchanged from last successful save, retry next hour |

---

## RPC Cost

| Mode | Calls | Time |
|------|-------|------|
| Incremental (warm cache) | ~175 | ~30 seconds |
| Cold start (cache evicted) | ~835 | ~7 minutes |
| Daily (24 incremental runs) | ~670 | Well within free tier |

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
