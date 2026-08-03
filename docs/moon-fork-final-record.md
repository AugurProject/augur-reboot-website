---
title: Final Moon Fork Record
tags: [augur, moon-fork, fork-record, provenance, rep]
---

# Final Moon Fork Record

## Status and observation anchor

This is the authoritative post-deadline factual record for the Moon Fork. It is an Ethereum mainnet observation, not an interpretation of migration percentages or a copy of a pre-close website snapshot.

| Observation | Value |
|---|---|
| Chain | Ethereum mainnet (`chainId` 1) |
| Finalized block | [`25,677,103`](https://etherscan.io/block/25677103) |
| Block hash | `0xab19846fa87d598ab7cf801092d94533b1fd4f3a0ebe2dc442c49f188f3af5b7` |
| Block time | `2026-08-03T21:36:23Z` |
| Migration deadline | `1785718859` — `2026-08-03T01:00:59Z` |
| Post-deadline distance | 74,124 seconds (20 hours, 35 minutes, 24 seconds) |
| Independent reads | PublicNode and dRPC returned the same block hash, deadline, winner, current REP identity, and migration totals |

All contract reads below were pinned to block `25,677,103`. The current generator pins the fork-state calls and lifecycle classification to `observedBlock` and its timestamp, so a record cannot mix values from different heads or use process wall time to classify a lagging block.

## Final record

| Fact | Verified value | Authority |
|---|---|---|
| Parent/forking universe | [`0x49244BD018Ca9fd1f06ecC07B9E9De773246e5AA`](https://etherscan.io/address/0x49244BD018Ca9fd1f06ecC07B9E9De773246e5AA) | The forking market's `getUniverse()` and the Augur v2 mainnet deployment record agree. |
| Forking market | [`0x963EED85778CC23E2D4636Cd4f29eECDF9827E9e`](https://etherscan.io/address/0x963EED85778CC23E2D4636Cd4f29eECDF9827E9e) | Parent universe `getForkingMarket()`; market `isFinalized()` returned `true`. |
| Winning universe | [`0x281171519Fb41540528398d8ED3EA257f0F32A9f`](https://etherscan.io/address/0x281171519Fb41540528398d8ED3EA257f0F32A9f) | Parent universe `getWinningChildUniverse()`. |
| Canonical universe | `0x281171519Fb41540528398d8ED3EA257f0F32A9f` | Public presentation name for the contract-reported winning universe; not inferred from a tally. |
| Winning outcome | Outcome index 1, `Yes` | The winning child matches index 1's payout hash; its on-chain REP symbol is `REPv2_Yes_1`. |
| Current REP | [`REPv2_Yes_1` — `0xCf6A0A7826fa124B7705d6f3c675eAD76f1e540D`](https://etherscan.io/token/0xCf6A0A7826fa124B7705d6f3c675eAD76f1e540D) | Winning universe `getReputationToken()` plus token `symbol()`. This matches Augur ForkWatch's version-controlled token registry. |
| Fork reputation goal | `5,497,186.882986651334933313 REP` (`5497186882986651334933313` wei) | Parent universe `getForkReputationGoal()`. |

“Canonical universe” is a site term for the exact child returned by `getWinningChildUniverse()`.

## Final migration totals

The final tallies are each child reputation token's `getTotalMigrated()`, not ERC-20 `totalSupply()`.

| Index / outcome | Payout hash | Child universe | REP token | Final migrated REP |
|---|---|---|---|---|
| 0 / Invalid | `0x8120c1e924d9d073442a1f9615009583146a839d1e0aaae6efd4e0b554d493c5` | No child at the observed block | None | `0` wei — `0 REP` |
| 1 / Yes | `0x544cbfd6b85821f7bbff5de4b999b0b4b701354a3f2d0c4707fd0358295b0173` | `0x281171519Fb41540528398d8ED3EA257f0F32A9f` | `0xCf6A0A7826fa124B7705d6f3c675eAD76f1e540D` (`REPv2_Yes_1`) | `6398081413681494610869400` wei — `6,398,081.4136814946108694 REP` |
| 2 / No | `0x99c9250f58203a3183137eae3a39da9d9d956cd08d1707a58cff5cddf957afe5` | `0xbaaD633FAa0E4847A4b66043E3E92102e5800546` | `0x2F4005456c2F098358213f01DbE34abDAa2989A4` (`REPv2_No_1`) | `1786227400866527400056` wei — `1,786.227400866527400056 REP` |

These values are safe to call final migration totals because the deployed Augur v2 `ReputationToken.migrateIn()` increments `totalMigrated` and rejects migration at or after the parent universe's fork end time. `getTotalMigrated()` returns that dedicated counter.

## Source and provenance matrix

### Primary: Ethereum contract and block state

The observation queried these methods with block tag `25,677,103`:

- Parent universe: `isForking()`, `getForkingMarket()`, `getForkEndTime()`, `getForkReputationGoal()`, `getWinningChildUniverse()`, `getReputationToken()`, and `getChildUniverse(bytes32)`.
- Forking market: `getUniverse()`, `isFinalized()`, `getNumberOfOutcomes()`, and `getNumTicks()`.
- Child universes: `getParentUniverse()` and `getReputationToken()`.
- Child REP tokens: `symbol()`, `getTotalMigrated()`, and `totalSupply()`.
- Block: number, hash, and timestamp from Ethereum JSON-RPC. A second endpoint reproduced the material values at the same block.

### Version-controlled Augur records

- [Augur v2 mainnet deployment record at commit `bd13a797`](https://github.com/AugurProject/augur/blob/bd13a797016b373834e9414096c6086f35aa628f/packages/augur-artifacts/src/environments/mainnet.json#L81-L86) identifies network 1, the parent universe, and the REPv1 legacy contract.
- [`Universe.fork()`](https://github.com/AugurProject/augur/blob/bd13a797016b373834e9414096c6086f35aa628f/packages/augur-core/src/contracts/reporting/Universe.sol#L99-L106) sets the fork end time; [`getForkEndTime()`](https://github.com/AugurProject/augur/blob/bd13a797016b373834e9414096c6086f35aa628f/packages/augur-core/src/contracts/reporting/Universe.sol#L158-L160) exposes it.
- [`getWinningChildUniverse()`](https://github.com/AugurProject/augur/blob/bd13a797016b373834e9414096c6086f35aa628f/packages/augur-core/src/contracts/reporting/Universe.sol#L351-L358) is the winner authority. It uses the child token's dedicated migrated amount and the fork goal/deadline.
- [`ReputationToken.migrateIn()`](https://github.com/AugurProject/augur/blob/bd13a797016b373834e9414096c6086f35aa628f/packages/augur-core/src/contracts/reporting/ReputationToken.sol#L60-L72) enforces the deadline and increments `totalMigrated`; [`getTotalMigrated()`](https://github.com/AugurProject/augur/blob/bd13a797016b373834e9414096c6086f35aa628f/packages/augur-core/src/contracts/reporting/ReputationToken.sol#L135-L137) exposes the tally.
- [Augur ForkWatch's REP registry at commit `19a05e5c`](https://github.com/AugurProject/augur-forkwatch-website/blob/19a05e5c276e0b9088ae57d8db54241797a95a22/src/domain/tokens/rep-tokens.ts#L20-L48) independently preserves REPv1, pre-fork REPv2, and `REPv2_Yes_1` identities on Ethereum mainnet.

No official publication or archived artifact was needed to override a contract value.

## Conflict resolved: token supply is not migrated REP

The deployed `/data/fork-risk.json` snapshot generated at `2026-08-03T21:40:44.836Z` and block `25,677,124` reported the Yes child's ERC-20 `totalSupply()` (`6,545,760.433666705… REP`) as `migratedRep`. At the finalized evidence block, the same token reported:

- `totalSupply()`: `6,545,760.433666705616389974 REP`
- `getTotalMigrated()`: `6,398,081.4136814946108694 REP`
- difference: `147,679.019985211005520574 REP`

`totalSupply()` can include protocol mints and burns and is not the contract's migration counter. The generator now uses `getTotalMigrated()` for `migratedRep` and adds exact `migratedRepWei` strings while retaining the existing numeric field for compatibility. The earlier supply-derived number is not a final migration total.

## Final versus observed-only fields

### Safe to present as final

- Migration deadline.
- Winning/canonical child universe and outcome.
- Current REP contract associated with the winning universe.
- Per-outcome `getTotalMigrated()` tallies after the deadline.
- Parent universe, forking market, and legacy REP contract identities.

### Observation metadata, not final retrospective totals

- `isForking()` returned `true` at the evidence block. In the deployed source it means “forking or has forked” (`forkingMarket != 0`), so it does **not** mean migration remains open.
- Child-token `totalSupply()` is a block-specific supply observation and must not be labeled migrated REP.
- Parent `universeRepSupply`, risk percentages, RPC latency, `generatedAt`, and monitoring metrics are operational snapshots.
- Any migration percentage using an assumed 11 million REP denominator is derived presentation, not a final protocol fact.

## Post-close preservation and compatibility

The generated endpoint remains schema version 2 and keeps all pre-existing top-level risk fields and the `forkActive` compatibility shape unchanged. `fork.outcomes[].migratedRep` remains a number; additive optional `fork.outcomes[].migratedRepWei` carries exact totals without changing older consumers. Generation fails rather than publishing if the winning universe reports a current REP address or symbol other than the verified `REPv2_Yes_1` identity.

The deployed Augur v2 parent still returned `isForking() == true` after the deadline, consistent with [its source implementation](https://github.com/AugurProject/augur/blob/bd13a797016b373834e9414096c6086f35aa628f/packages/augur-core/src/contracts/reporting/Universe.sol#L204-L210). The defensive generator path is nevertheless tested with `isForking() == false` and a passed nonzero deadline: it selects the post-deadline record path, re-reads fork metadata at one block, and emits both `fork` and legacy `forkActive` data rather than reverting to ordinary monitoring.

Consumers audited for compatibility:

- `src/features/fork-monitor/data-provider.tsx`
- `src/features/fork-monitor/validate-fork-data.ts`
- `src/features/fork-monitor/derive-fork-lifecycle.ts`
- `src/features/fork-monitor/active-card.tsx`
- `src/features/fork-monitor/post-fork-record.tsx`
- `src/features/fork-monitor/mock-provider.tsx`
- `src/lib/fork-data.ts`

## Preserved REP identities

| Role | Ethereum mainnet address | Status |
|---|---|---|
| REPv1 | `0x1985365e9f78359a9B6AD760e32412f4a445E862` | Legacy input token; not current REP |
| REPv2 | `0x221657776846890989a759BA2973e427DfF5C9bB` | Pre-fork parent-universe token; not current REP |
| REPv2_Yes_1 | `0xCf6A0A7826fa124B7705d6f3c675eAD76f1e540D` | Current REP in the winning/canonical universe |
| REPv2_No_1 | `0x2F4005456c2F098358213f01DbE34abDAa2989A4` | Losing child-universe token; preserved for provenance |

## Related documentation

- [[public-data-endpoints]] — compatible public JSON contract
- [[fork-monitoring-pipeline]] — generation and deployment path
- [[fork-monitoring-methodology]] — monitoring implementation
- [[public-knowledge-architecture]] — retrospective evidence policy
- [[post-fork-landing-page-implementation-plan]] — lifecycle presentation
- [[migration-guide-feature]] — preserved historical procedure
