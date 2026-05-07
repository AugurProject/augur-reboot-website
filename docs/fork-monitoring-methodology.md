---
title: Fork Monitoring Methodology
tags: [fork-monitoring, methodology, calculation]
---

# Fork Monitoring Methodology

> How the fork monitor discovers markets, reads bond sizes, and computes the threshold percentage.
> For the pipeline that runs this hourly, see [[fork-monitoring-pipeline]]. For the protocol mechanics, see [[fork-mechanics]].

---

## Core Measurement

The monitor answers one question:

> **How far through its dispute rounds is the market, relative to the estimated total rounds before a fork?**

```
round progress = (current round / estimated total rounds) × 100
```

- **Current round**: the index of the highest non-zero participant (0-indexed)
- **Estimated total rounds**: projected from the bond growth trajectory (see Round Projection below)
- **Fork threshold**: read live from `universe.getDisputeThresholdForFork()` (~274,859 REP as of April 2026)

The gauge signal is round progress, not bond/threshold percentage. During active disputes, the bond grows exponentially but may be only ~3% of the fork threshold even at round 7 of ~12 — visually invisible. Round progress maps the same state to a linear, intuitive scale.

> **Historical note**: The monitor previously used `(largest dispute bond / fork threshold) × 100` as the gauge signal. This was replaced with round-based progress in May 2026 because the bond/threshold ratio compresses exponential escalation into an invisible sliver during active dispute phases, making the gauge read "LOW" while the dispute was well past the halfway point.

---

## Market Discovery

The monitor discovers markets with active disputes from three sources, merged and deduplicated:

| Source | Location | Lifespan | Purpose |
|--------|----------|----------|---------|
| **Seed file** | `public/data/dispute-markets-seed.json` | Git-committed, manual update | Guaranteed baseline when cache is cold |
| **Tracked markets** | Inside `event-cache.json` | Persisted across runs via `actions/cache` | Memory of previously discovered markets |
| **Live events** | RPC query of Contribution/Completed events | 30-day scan on cold start, incremental thereafter | Discovers newly disputed markets |

**Discovery flow**:

1. On cold start (no cache): 30-day event scan discovers all markets with recent dispute activity
2. Discovered markets are added to tracked markets (persisted in event cache)
3. On each hourly run: incremental event scan finds any *new* markets
4. All tracked markets are verified on-chain
5. Finalized or empty markets are removed from tracking
6. Tracked markets are **never pruned** by the event window — only removed when on-chain verification confirms they're finalized

> **Why three sources**: Events older than 7 days are pruned from the cache. A market that started disputing 10 days ago with no recent contributions would be invisible to events alone. The tracked markets list remembers it. If the cache is lost entirely, the seed file provides a guaranteed baseline.

---

## On-Chain Verification

Every tracked market is verified on-chain each run:

1. `market.isFinalized()` → **true**: removed from tracking (dispute resolved)
2. `market.getNumParticipants()` == 0: **removed** (no dispute activity)
3. All participants read sequentially (index 0 through N):
   - `market.participants(i).getSize()` → target bond for round *i*
   - Bond trajectory recorded for projection (see Round Projection below)
   - Highest non-zero participant = current/latest dispute round
   - Largest `getSize()` across all participants = the market's dispute bond
4. Read error: **kept** in tracking (conservative — don't lose track of a market)

### Round Projection

The script reads ALL participant bonds (not just the largest) to build a bond trajectory: `[b0, b1, b2, …, bn]`. It uses the last 3–4 rounds to compute an average growth factor, then projects forward until the bond would exceed the fork threshold:

```
avg_growth = mean(b[i] / b[i-1] for recent rounds)
estimated_total = smallest n where b[n] × avg_growth^(n-current) >= fork_threshold
```

The projection is conservative — if fewer than 3 rounds exist, or the growth factor diverges (projection exceeds 30 rounds), `estimatedTotalRounds` is `null` and round progress defaults to 0.

### Why `getSize()` not `getStake()`

`getSize()` returns the **target bond** for the round — the value Augur compares against the fork threshold. `getStake()` returns the currently accumulated amount, which may be partial (crowdsourcer not yet fully filled). For measuring fork proximity, `getSize()` is the protocol-correct value.

> **Source**: [[fork-mechanics]] → The Bond Size Formula

---

## Event Args Layout

The Augur v2 contract emits two event types used for discovery. Their argument positions differ:

| Event | args[0] | args[1] | args[2] | args[3] |
|-------|---------|---------|---------|---------|
| `DisputeCrowdsourcerContribution` | universe | reporter | **market** | crowdsourcer |
| `DisputeCrowdsourcerCompleted` | universe | **market** | crowdsourcer | — |

`DisputeCrowdsourcerCreated` is also queried for discovery. Contribution events are the primary source; Created events provide additional coverage.

---

## Contract Addresses (Augur v2, Mainnet)

| Contract | Address |
|----------|---------|
| Universe (v2 genesis) | `0x49244BD018Ca9fd1f06ecC07B9E9De773246e5AA` |
| Augur (v2) | `0x23916a8F5C3846e3100e5f587FF14F3098722F5d` |
| REPv2 Token | `0x221657776846890989a759BA2973e427DfF5C9bB` |
| Cash (DAI) | `0xd5524179cb7ae012f5b642c1d6d700bbaa76b96b` |

---

## RPC Strategy

### Endpoints

- **Primary**: PublicNode (`https://ethereum-rpc.publicnode.com`)
- **Fallbacks**: dRPC, 1RPC (auto-tried on failure)
- **Optional**: `ETH_RPC_URL` env var prepended as primary when set

All endpoints are free public RPCs. No API keys required.

### Scan Modes

| Mode | When | Block range | RPC cost |
|------|------|-------------|----------|
| **Cold start** | `lastQueriedBlock == 0` or cache missing | 30 days (~216K blocks) | ~835 calls, ~7 minutes |
| **Incremental** | Cache is warm | `lastQueriedBlock - 32` to current | ~175 calls, ~30 seconds |

### Cold start behavior

When the event cache is missing (cache eviction, first run):
1. Creates empty cache
2. Loads seed file for guaranteed market coverage
3. Performs 30-day event scan in 1000-block chunks
4. Verifies all discovered markets on-chain
5. Saves warm cache for next run

---

## Event Cache

The cache (`event-cache.json`) holds:

| Field | Purpose | Pruned? |
|-------|---------|---------|
| `lastQueriedBlock` | Where to resume incremental scanning | Updated each run |
| `trackedMarkets` | Known dispute markets | Only removed when `isFinalized()` on-chain |
| `events` | Recent contribution/completed events | 7-day rolling window |

Events are only used for *discovery* — once a market is tracked, it stays until on-chain verification removes it. Old events for tracked markets are redundant, so the 7-day pruning is safe.

---

## Risk Levels

The UI displays round progress as a risk level:

| Level | Round Progress | Description |
|-------|----------------|-------------|
| None | 0% | No active disputes |
| Low | <25% | Early dispute rounds |
| Moderate | 25–50% | Mid-escalation |
| High | 50–75% | Late-stage dispute |
| Critical | ≥75% | Approaching fork threshold |

These levels are display categories derived from round progress. The bond/threshold percentage is still computed and stored in the data, but the primary gauge signal and risk labels use round progress.

---

## Seed File

`public/data/dispute-markets-seed.json` — a git-committed list of known long-running dispute markets. Updated via PR when significant new disputes are identified. Serves as the third line of defense when both the event cache and event scan are insufficient.

---

## Auditability

Anyone can verify the monitor's calculations:

1. **Calculation script**: `scripts/calculate-fork-risk.ts`
2. **Diagnostic probe**: `scripts/probe-fork-state.ts <marketAddress>`
3. **Seed file**: `public/data/dispute-markets-seed.json`
4. **On-chain verification**: compare `market.participants(i).getSize()` directly

---

## Cross-References

- [[fork-mechanics]] — what the monitor is measuring and why
- [[fork-monitoring-pipeline]] — the CI/CD pipeline that runs this hourly
- [[augur-v2-protocol-glossary]] — raw protocol constants and formulas
