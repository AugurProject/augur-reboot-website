---
title: Public Data Endpoints
tags: [data, api, external-consumers, fork-risk]
---

# Public Data Endpoints

Augur.net serves structured JSON at stable URLs under `/data/` for external consumers: exchanges, dashboards, fork trackers, community explorers, and integrator tools.

## Convention

Every endpoint carries:

| Field | Type | Description |
|---|---|---|
| `generatedAt` | `string` (ISO 8601) | When the data was last computed. Poll this to detect staleness. |
| `schemaVersion` | `string` | Semantic version of the response shape. Increments on breaking changes. |

Adding a field is safe. Renaming or removing a top-level field is a breaking change — coordinate with known consumers.

## Endpoints

### `/data/fork-risk.json`

Live fork status from on-chain Augur contracts. Updated hourly by CI.

```
GET /data/fork-risk.json
Refresh: every hour (GitHub Actions cron: 0 * * * *)
Pipeline: scripts/calculate-fork-risk.ts
```

#### Top-level fields

| Field | Type | Description |
|---|---|---|
| `generatedAt` | `string` (ISO 8601) | Last pipeline run timestamp |
| `schemaVersion` | `string` | Response shape version |
| `blockNumber` | `number` | Ethereum block at time of calculation |
| `riskLevel` | `enum` | `none` \| `low` \| `moderate` \| `high` \| `critical` \| `unknown` |
| `riskPercentage` | `number \| null` | Round progress as percentage (0–100). `null` when projection unavailable. |
| `metrics` | `object` | Dispute and escalation metrics (below) |
| `rpcInfo` | `object` | RPC endpoint used, latency, fallback count |
| `calculation` | `object` | `forkThreshold` — REP threshold that triggers fork |
| `cacheValidation` | `object` | Cache health: `isHealthy: boolean`, optional `discrepancy` |
| `forkActive` | `object \| null` | Present only when fork is live (below) |
| `error` | `string \| null` | Error message if pipeline failed |

#### `metrics`

| Field | Type | Description |
|---|---|---|
| `largestDisputeBond` | `number` | Largest active dispute bond in REP |
| `forkThresholdPercent` | `number` | Bond size as percentage of fork threshold |
| `activeDisputes` | `number` | Count of disputes with active bonds |
| `disputeDetails` | `array` | Active dispute entries (up to 5), each with `marketId`, `title`, `disputeBondSize`, `disputeRound`, `estimatedTotalRounds`, `roundProgress`, `weeksRemaining` |
| `currentRound` | `number` | Round number of the largest dispute |
| `estimatedTotalRounds` | `number \| null` | Projected rounds to reach fork threshold. `null` if projection unavailable. |
| `roundProgress` | `number \| null` | `currentRound / estimatedTotalRounds` as percentage. `null` if projection unavailable. |

#### `forkActive`

Present and non-null only when a fork is live. Absent (`null` or missing) otherwise.

| Field | Type | Description |
|---|---|---|
| `forkingMarket` | `string` (address) | Augur market that triggered the fork |
| `forkEndTime` | `number` (unix seconds) | Fork window end |
| `forkReputationGoal` | `number` | REP needed for >50% early resolution |
| `universeRepSupply` | `number` | Total REP supply in the forking universe |
| `outcomes` | `array` | Per-outcome child universes and migration tallies |

`outcomes[]` entries:

| Field | Type | Description |
|---|---|---|
| `index` | `number` | Outcome index (0 = Invalid, 1+ = outcome labels) |
| `label` | `string` | Human-readable outcome label |
| `childUniverse` | `string \| null` | Child universe address, or `null` if none created |
| `migratedRep` | `number` | REP migrated to this outcome so far |

**Risk level thresholds**: `none` (0%), `low` (1–24%), `moderate` (25–49%), `high` (50–74%), `critical` (75–100%). When `forkActive` is present, `riskLevel` is always `critical` and `roundProgress` is `100`.

For pipeline internals, see [[fork-monitoring-pipeline]].

## Related

- [[fork-monitoring-pipeline]] — CI pipeline details for fork-risk.json
- `scripts/calculate-fork-risk.ts` — pipeline script (in-repo)
