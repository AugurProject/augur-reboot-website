---
title: Public Data Endpoints
tags: [data, api, external-consumers, fork-risk]
---

# Public Data Endpoints

Augur.net serves structured JSON at stable URLs under `/data/` for external consumers: exchanges, dashboards, fork trackers, community explorers, and integrator tools.

## Compatibility

The endpoint now emits additive schema version 2 fields. Treat renaming, removing, or changing the type of an existing field as a breaking change and coordinate it with known consumers. Older consumers can continue reading the existing risk and `forkActive` fields.

## Endpoints

### `/data/fork-risk.json`

Fork status from on-chain Augur contracts. Updated by the fork-monitoring
workflow while monitoring is active. The lifecycle record remains available
after the migration deadline; monitoring cadence is a separate operational
decision.

```
GET /data/fork-risk.json
Refresh: currently hourly (GitHub Actions cron: `0 * * * *`); cadence changes are handled by the monitoring workflow
Pipeline: scripts/calculate-fork-risk.ts
```

#### Top-level fields

| Field | Type | Description |
|---|---|---|
| `lastRiskChange` | `string` (ISO 8601) | Timestamp of the latest calculation. Poll this to detect staleness. |
| `schemaVersion` | `number`, optional | Versioned data contract; current generated records use `2`. |
| `generatedAt` | `string` (ISO 8601), optional | Timestamp used to derive the emitted lifecycle status. |
| `blockNumber` | `number`, optional | Ethereum block at time of calculation; omitted from error results |
| `riskLevel` | `enum` | `none` \| `low` \| `moderate` \| `high` \| `critical` \| `unknown` |
| `riskPercentage` | `number \| null` | Round progress as percentage (0–100). `null` when projection unavailable. |
| `metrics` | `object` | Dispute and escalation metrics (below) |
| `rpcInfo` | `object`, optional | RPC endpoint used, latency, fallback count |
| `calculation` | `object` | `forkThreshold` — REP threshold that triggers fork |
| `cacheValidation` | `object`, optional | Cache health: `isHealthy: boolean`, optional `discrepancy` |
| `fork` | `object \| null`, optional | Normalized fork lifecycle record (schema v2, below) |
| `forkActive` | `object`, optional | Backward-compatible active-fork fields or preserved compatibility snapshot (below) |
| `error` | `string`, optional | Error message if the pipeline failed |

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

Present for an active fork and may be retained in the finalized record for
older consumers. New consumers should use `fork` as the lifecycle source.

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

#### `fork` (schema v2)

The normalized record is the source for lifecycle presentation. `status` can be `migration-open`, `migration-open-resolved`, `migration-closed-resolved`, or `migration-closed-unverified`; non-fork records use `fork: null`.

| Field | Type | Description |
|---|---|---|
| `status` | `enum` | Lifecycle status emitted at generation time |
| `parentUniverse` | `string \| null` | Parent/forking universe address |
| `forkingMarket` | `string` | Market that triggered the fork |
| `migrationDeadline` | `number` | Unix timestamp at which migration closes |
| `reputationGoal` | `number` | REP needed for early resolution |
| `winningChildUniverse` | `string \| null` | Contract-reported winner, when known |
| `outcomes` | `array` | Outcome records, including child universe, REP token, and migrated REP |
| `observedBlock` | `number`, optional | Ethereum block used for the record |

The browser derives the current display state from `fork.winningChildUniverse`, `fork.migrationDeadline`, and current time. A winner known before the deadline does not make the endpoint post-fork; it remains `migration-open-resolved` until the deadline.

**Risk level thresholds**: `none` (0%), `low` (1–24%), `moderate` (25–49%), `high` (50–74%), `critical` (75–100%). When `forkActive` is present, `riskLevel` is always `critical` and `roundProgress` is `100`.

For pipeline internals, see [[fork-monitoring-pipeline]].

## Related

- [[fork-monitoring-pipeline]] — CI pipeline details for fork-risk.json
- `scripts/calculate-fork-risk.ts` — pipeline script (in-repo)
