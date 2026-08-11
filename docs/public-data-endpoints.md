---
title: Public Data Endpoints
tags: [data, api, external-consumers, fork-risk, rep-supply]
---

# Public Data Endpoints

Augur.net serves structured JSON at stable URLs under `/data/`, plus bare-number REP supply endpoints under `/api/supply/`, for external consumers: exchanges, aggregators, dashboards, fork trackers, community explorers, and integrator tools.

## Compatibility

The endpoint emits additive schema version 2 fields. Treat renaming, removing, or changing the type of an existing field as a breaking change and coordinate it with known consumers. Older consumers can continue reading the existing risk and unchanged `forkActive` shape. Exact migration tallies are additive `fork.outcomes[].migratedRepWei` strings; the existing numeric `migratedRep` field remains available.

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
| `generatedAt` | `string` (ISO 8601), optional | Generation metadata; not the authority for the observed record's lifecycle status. |
| `blockNumber` | `number`, optional | Ethereum block at time of calculation; omitted from error results |
| `riskLevel` | `enum` | `none` \| `low` \| `moderate` \| `high` \| `critical` \| `unknown` |
| `riskPercentage` | `number \| null` | Round progress as percentage (0–100). `null` when projection unavailable. |
| `metrics` | `object` | Dispute and escalation metrics (below) |
| `rpcInfo` | `object`, optional | RPC endpoint host used, latency, fallback count |
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
| `migratedRep` | `number` | REP migrated to this outcome, read from the child token's `getTotalMigrated()` counter; final after the migration deadline |

#### `fork` (schema v2)

The normalized record is the source for lifecycle presentation. `status` can be `migration-open`, `migration-open-resolved`, `migration-closed-resolved`, or `migration-closed-unverified`; non-fork records use `fork: null`.

| Field | Type | Description |
|---|---|---|
| `status` | `enum` | Lifecycle status classified at the observed block's timestamp |
| `parentUniverse` | `string \| null` | Parent/forking universe address |
| `forkingMarket` | `string` | Market that triggered the fork |
| `migrationDeadline` | `number` | Unix timestamp at which migration closes |
| `reputationGoal` | `number` | REP needed for early resolution |
| `winningChildUniverse` | `string \| null` | Contract-reported winner, when known |
| `outcomes` | `array` | Outcome records, including child universe, REP token, and migrated REP |
| `observedBlock` | `number`, optional | Ethereum block used for the record; fork-state calls and generated lifecycle classification use this block and its timestamp |

`fork.outcomes[]` retains the numeric compatibility fields and adds:

| Field | Type | Description |
|---|---|---|
| `reputationToken` | `string \| null`, optional | Child universe REP token address |
| `migratedRepWei` | `string`, optional | Exact integer form of `getTotalMigrated()` in wei |
| `isWinner` | `boolean`, optional | Whether the outcome matches `winningChildUniverse` |

The browser derives the current display state from `fork.winningChildUniverse`, `fork.migrationDeadline`, and current time. A winner known before the deadline does not make the endpoint post-fork; it remains `migration-open-resolved` until the deadline.

**Risk level thresholds**: `none` (0%), `low` (1–24%), `moderate` (25–49%), `high` (50–74%), `critical` (75–100%). When `forkActive` is present, `riskLevel` is always `critical` and `roundProgress` is `100`.

Do not substitute an outcome token's ERC-20 `totalSupply()` for `migratedRep`. Supply can differ from the dedicated migration counter after protocol mints or burns. The verified final values and the superseded supply-derived snapshot are documented in [[moon-fork-final-record]].

For pipeline internals, see [[fork-monitoring-pipeline]].

### `/api/supply/*` — REP supply endpoints

Bare-number supply values for the CoinMarketCap listing form. Exactly one REP identity is published — REPv2_Yes_1, current REP — and it is the only token this API supports. Identity verified in [[moon-fork-final-record]]:

| Symbol | Address | What it is |
|---|---|---|
| `REPv2_Yes_1` | `0xCf6A0A7826fa124B7705d6f3c675eAD76f1e540D` | Current REP, the winning/canonical child universe token of the Moon Fork. |

REPv1 (`0x1985365e9f78359a9B6AD760e32412f4a445E862`), REPv2 (`0x221657776846890989a759BA2973e427DfF5C9bB`), and REPv2_No_1 (`0x2F4005456c2F098358213f01DbE34abDAa2989A4`) have no endpoints. REPv2's remaining supply is a permanently stranded balance in a dead universe — the fork window closed on 2026-08-03 — not a live circulating asset, and publishing a supply for it would present it as one.

```
GET /api/supply/total/         → 6545760.433666705616389974
GET /api/supply/circulating/   → 6545760.433666705616389974
GET /api/supply/meta.json      → provenance: generatedAt, blockNumber, exact wei
Refresh: hourly (same cron as fork monitoring) plus every deploy to main
Pipeline: scripts/generate-supply-endpoints.ts (rep-supply job in build-and-deploy.yml)
```

**Submit the trailing-slash URLs to CoinMarketCap.** Total and circulating are separate fields on the form; each URL is polled independently. The slashless form (`/api/supply/total`) `301`s to the trailing-slash form, so either works for a client that follows redirects, but submit the trailing-slash URL to avoid the hop.

An earlier revision also served CoinGecko-shaped `{"result":"<decimal>"}` twins at `.json` paths and a second token (`repv2`) under per-token slugs. Both were removed: CoinGecko's supply update went through its form without an API, and REPv2 is not a live asset. The single-token layout has no per-token path segment; supporting another token again would mean reintroducing slugs (see git history of `scripts/generate-supply-endpoints.ts`).

#### Requirements checklist

| Requirement | Source | How it is met |
|---|---|---|
| "Numerical value only and denominated in the same units to calculate the price" | CoinMarketCap listing form | The body is the bare decimal in whole token units, all 18 decimals, and nothing else — no object wrapper, separators, exponent, markup, or trailing newline. A bare number is also valid JSON (RFC 8259 permits a top-level number), so JSON-expecting parsers read it too |
| HTTPS endpoint | CoinMarketCap listing form (also its example endpoint) | Pages serves HTTPS with HSTS; `http://` and apex `augur.net` both 301 to `https://www.augur.net` — always submit the `https://www.` form |
| Publicly accessible, no authentication or API key | General aggregator expectation; matches CMC's cited example | Static files, no auth, `access-control-allow-origin: *` |
| Survives aggregator polling | General aggregator expectation (CoinGecko's stated floor is once every 30 minutes) | Static CDN assets with `cache-control: max-age=600`; no origin, RPC, or metered service in the request path |
| No bot-blocking in front of the endpoint | Aggregator pollers are automated clients | No Cloudflare or WAF in front of Pages. The `@astrojs/cloudflare` adapter in `astro.config.mjs` applies to local dev only; CI sets `GITHUB_ACTIONS=true` and builds static output for Pages. `robots.txt` explicitly allows `/api/supply/` |

The CoinMarketCap wording is quoted from its listing form (its support articles return `403` to automated fetches); the form's cited example endpoint (`chainz.cryptoid.info/grs/api.dws?q=totalcoins` → `90671648.88736623`) was re-verified live.

Numbers in `meta.json` are strings rather than JSON numbers so that all 18 decimals survive transport — parsed into a float64 they would round near the 17th significant digit. Anyone needing the exact integer should read `totalSupplyWei` there.

#### Why the bare number is a directory index

GitHub Pages infers `Content-Type` from the file extension and offers no way to set headers. That constrains how an extension-free URL can be served, and the options were measured on the fork's Pages deployment rather than assumed:

| Backing file | URL | Content-Type | Browser |
|---|---|---|---|
| `total` (no extension) | `…/total` | `application/octet-stream` | downloads a file |
| `total.txt` | `…/total.txt` | `text/plain; charset=utf-8` | renders |
| `total/index.html` | `…/total/` | `text/html; charset=utf-8` | renders |

The directory index is the only one that keeps the URL extension-free *and* renders in a browser, so it is what ships. The trade is a trailing slash and an `index.html` that deliberately contains no markup — any tag would violate "numerical value only", and a browser renders bare text in an HTML document anyway. Every HTTP client reads the same 26-byte body regardless of which row above is served, so the choice is about human inspection, not about what the aggregators receive.

#### Deployment target

`www.augur.net` is built from **`AugurProject/augur-reboot-website`**, not from the `melodrd` fork. The fork publishes to `melodrd.github.io/augur-reboot-website`, which is useful for verifying the pipeline end to end, but aggregator submissions must use `www.augur.net` URLs — so these endpoints have to land upstream before the CoinMarketCap form is filled in.

**Circulating equals total**: no locked, reserved, or treasury allocations. Supply has been effectively fixed since the fork window closed on 2026-08-03 — the only remaining mint path is `forkAndRedeem` on unredeemed forking-market bonds — but it is read live rather than hardcoded so the published value can never drift from the chain.

Values come from ERC-20 `totalSupply()` pinned to a single block, read a few blocks behind the chain tip to avoid load-balanced-backend races and reorg exposure. Generation is fail-closed, matching the fork-risk pipeline: on-chain `symbol()` and `decimals()` must match the verified identity, and any value outside `(0, 11,000,000]` whole tokens is rejected. On any failure nothing is written, the job fails, no deploy happens, and the previously published values stay live. `meta.json` carries `generatedAt`, `blockNumber`, and the exact wei value — poll it to detect staleness.

## Related

- [[fork-monitoring-pipeline]] — CI pipeline details for fork-risk.json
- `scripts/calculate-fork-risk.ts` — pipeline script (in-repo)
