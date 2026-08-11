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
| Architecture | Three-job pipeline: `risk-monitor` → `build` → `deploy`; an independent `rep-supply` job also feeds `build` (see [[public-data-endpoints]]) |
| Concurrency | Ref-scoped group `fork-risk-pipeline-${{ github.ref }}`; main runs queue, superseded PR runs cancel |
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
3. Run `scripts/calculate-fork-risk.ts` (including the post-deadline fork-record preservation path)
4. On a cache miss, save the resulting cache under `event-cache-v1`
5. Upload `fork-risk.json` as artifact (`fork-risk-data`)

### rep-supply (always runs, parallel to risk-monitor)

Generates the bare-number REP supply endpoints under `public/api/supply/` via `scripts/generate-supply-endpoints.ts`. Same fail-closed model as risk-monitor: RPC fallback chain, identity and bounds validation, no output on failure. Documented in [[public-data-endpoints]].

### build (always runs, needs: risk-monitor + rep-supply)

1. Shallow checkout
2. Download `fork-risk-data` and `supply-data` artifacts
3. **Verify `fork-risk.json` and the supply files exist** — fail if missing
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

**Current limitation:** GitHub Actions cache entries are immutable. Once `event-cache-v1` exists for a ref, later exact-key hits restore that snapshot but do not replace it with the file updated by the script. Repository cache metadata confirms that the `main` cache was created on April 22, 2026 and has only been accessed since. The workflow remains functional, but it does not persist incremental cache updates across runs as intended.

### Why not `hashFiles`

The previous workflow used `event-cache-${{ runner.os }}-${{ hashFiles('public/cache/event-cache.json') }}`. Since the script updates tracked markets every run, the file hash changed every run and created a new cache entry each time. The static key stopped that proliferation, but it also stopped updated state from being saved. A future workflow fix should use unique save keys with a stable restore prefix, or explicitly replace the existing cache.

### Cold start (cache evicted)

When the cache is missing, the script performs a 30-day event scan (~7 minutes, ~835 RPC calls). The seed file supplies the known-market baseline. With the current static key, the first successful result becomes the immutable snapshot restored by later runs.

---

## Concurrency

```yaml
concurrency:
  group: fork-risk-pipeline-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

Ref-scoped top-level group. Cron, push-to-main, and dispatch runs all resolve to `refs/heads/main` and stay serialized (queued, never cancelled), which prevents:
- **Duplicate artifacts** — two runs producing separate `github-pages` artifacts (caused a deploy failure on the old workflow)
- **Cache races** — two runs writing to the cache simultaneously

Each PR gets its own `refs/pull/N/merge` group, so a PR run can never displace a pending main deploy run (GitHub cancels the *pending* run in a group when a new run queues, regardless of `cancel-in-progress`). Superseded PR runs are cancelled instead of consuming runner time and RPC quota.

---

## Failure Handling

| Scenario | Result |
|----------|--------|
| RPC endpoint down | Script auto-falls back to next endpoint |
| All RPC endpoints fail | Script fails → pipeline stops → retry next hour |
| Parent universe reports `isForking()` false after the deadline | The calculation path re-reads fork metadata and preserves the historical record |
| Lifecycle metadata read fails | The script retries the RPC endpoints; if none can verify lifecycle state, the job fails and no deploy occurs, preserving the last verified site |
| Cache missing | 30-day scan + seed file; successful job creates the static cache snapshot |
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
