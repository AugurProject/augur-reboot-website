# Fork Risk Assessment Methodology

## Overview

The Augur Fork Meter provides transparent monitoring of the risk that Augur's oracle will enter a fork state. This document outlines the methodology, calculations, data sources, and infrastructure used to assess this risk.

## Fork Trigger Mechanics

Based on the Augur v2 whitepaper, forks are triggered when:

1. **A dispute bond reaches the fork threshold** — read live from `universe.getDisputeThresholdForFork()` (approximately 2.5% of REP supply in the v2 genesis universe: ~274,859 REP as of April 2026)
2. **This creates a 60-day forking period** where REP holders must migrate to child universes
3. **The universe with the most migrated REP becomes the "winning" universe**

## Risk Calculation Framework

### Core Calculation

The meter reads live on-chain state for each tracked market:

1. **Market Discovery**: `DisputeCrowdsourcerContribution` and `DisputeCrowdsourcerCompleted` events from the Augur v2 contract identify markets with active disputes
2. **Bond Readout**: For each market, `market.participants(i).getSize()` gives the protocol-correct bond size for each dispute round — the target bond, which is what the fork threshold is measured against
3. **Fork Threshold**: Read live from `universe.getDisputeThresholdForFork()`, not hardcoded
4. **Risk Percentage**: `Risk % = (Largest Dispute Bond / Fork Threshold) × 100`

**Why `getSize()` over `getStake()`**: `getSize()` is the target bond for the round — the value Augur uses internally to determine if a fork triggers. `getStake()` is the amount currently accumulated, which may be partial. For public accuracy, the meter shows the authoritative protocol value.

### Market Tracking Architecture

Markets are tracked across three persistence layers:

| Layer | Lifespan | Purpose |
|---|---|---|
| **Events** (in cache) | 7 days, pruned | Discover *new* disputes entering the system |
| **Tracked markets** (in cache) | Indefinite until finalized | Remember *known* disputes across runs |
| **Seed file** (git-committed) | Manual | Safety net for long-running disputes that predate the event window |

**Discovery flow**:
1. On initial run or cache miss: 30-day event scan discovers all markets with dispute activity
2. Discovered markets are added to the tracked markets list (persisted in event cache)
3. On each hourly run: incremental event scan finds any *new* markets
4. All tracked markets are verified on-chain (`isFinalized()`, `getNumParticipants()`)
5. Finalized or empty markets are removed from tracking
6. Tracked markets are **never pruned** by the 7-day event window

**Seed file** (`public/data/dispute-markets-seed.json`): A git-committed list of known long-running disputes. Provides a guaranteed baseline when the event cache is lost (GH Actions cache eviction). Updated via PR when significant new disputes are identified.

### Risk Level Determination

| Level | Fork Threshold % | Description | Color |
|-------|------------------|-------------|--------|
| **None** | 0% | No active disputes | Default |
| **Low** | <10% | Normal operation, typical dispute activity | Green |
| **Moderate** | 10-25% | Elevated dispute activity above baseline | Yellow |
| **High** | 25-75% | Large disputes requiring close monitoring | Orange |
| **Critical** | ≥75% | Fork trigger imminent | Red (pulsing) |

## Data Sources and Architecture

### Blockchain Data Collection
- **Ethereum Mainnet**: Primary data source via public JSON-RPC endpoints
- **Augur v2 Contracts**:
  - Universe (v2 genesis): `0x49244BD018Ca9fd1f06ecC07B9E9De773246e5AA`
  - Augur (v2): `0x23916a8F5C3846e3100e5f587FF14F3098722F5d`
  - REPv2 Token: `0x221657776846890989a759BA2973e427DfF5C9bB`
  - Cash (DAI): `0xd5524179cb7ae012f5b642c1d6d700bbaa76b96b`

### Infrastructure Design
- **GitHub Actions**: Hourly automated calculations
- **Event Cache**: Persisted via `actions/cache`, survives between runs. Contains:
  - Raw events (7-day rolling window, pruned)
  - Tracked markets list (never pruned, only removed when finalized on-chain)
- **Seed File**: Git-committed `dispute-markets-seed.json` as cache-miss fallback
- **Public RPC Endpoints**: No API keys required, fully transparent access
  - Primary: PublicNode (`https://ethereum-rpc.publicnode.com`)
  - Fallbacks: dRPC, 1RPC
  - Optional: `ETH_RPC_URL` env var prepended as primary when set
- **Static JSON Output**: Results saved to `public/data/fork-risk.json`
- **Audit Trail**: All calculations and changes tracked in git history

### Update Frequency
- **Calculation**: Every hour via GitHub Actions
- **UI Refresh**: Every 5 minutes (data changes hourly)
- **Manual Triggers**: Available via `workflow_dispatch`

## Transparency and Auditability

Anyone can verify calculations by:
1. Reviewing the calculation script: `scripts/calculate-fork-risk.ts`
2. Running the diagnostic probe: `scripts/probe-fork-state.ts <marketAddress>`
3. Checking the seed file: `public/data/dispute-markets-seed.json`
4. Comparing on-chain state directly via `market.participants(i).getSize()`

## Limitations and Considerations

### Known Limitations
1. **Discovery blind spot**: A dispute that starts and stalls with zero contributions for 30+ days would be missed. However, meaningful disputes (high enough bond to register on the meter) escalate via bond-doubling rounds, guaranteeing regular contributions within 30 days.
2. **Event cache volatility**: GH Actions cache can be evicted, causing a 30-day rescan on next run. The seed file mitigates this by providing a guaranteed baseline.

### Timing Considerations
- **Dispute Windows**: up to 7 days each (first round: up to 24 hours), hourly monitoring is sufficient
- **Fork Duration**: Up to 60 days, providing ample warning time
- **Escalation Speed**: Multiple rounds required, attacks develop over days/weeks

## References

1. [Augur v2 Whitepaper](augur-whitepaper-v2.pdf) - Core fork mechanics
2. [Augur Documentation](https://docs.augur.net/) - Technical specifications
3. [GitHub Repository](/) - Source code and audit trail

---

**Last Updated**: April 21, 2026
**Version**: 2.0
**Maintained By**: Augur Fork Meter Project
