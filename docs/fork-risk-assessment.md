# Fork Risk Assessment Methodology

## Overview

The Augur Fork Meter provides transparent monitoring of the risk that Augur's oracle will enter a fork state. This document outlines the methodology, calculations, data sources, and infrastructure used to assess this risk.

## Fork Trigger Mechanics

Based on the Augur v2 whitepaper, forks are triggered when:

1. **A dispute bond reaches ≥2.5% of all theoretical REP** (275,000 REP out of 11 million total)
2. **This creates a 60-day forking period** where REP holders must migrate to child universes
3. **The universe with the most migrated REP becomes the "winning" universe**

## Risk Calculation Framework

### Simplified Risk Assessment

The Augur Fork Meter uses a direct, transparent calculation based solely on dispute bond size relative to the fork threshold:

#### Core Calculation
- **Dispute Bond Monitoring**: Track the largest active dispute bond across all markets
- **Fork Threshold**: 275,000 REP (2.5% of theoretical 11 million REP supply)
- **Risk Percentage**: Direct calculation of how close the largest dispute is to triggering a fork

**Primary Formula**: `Risk % = (Largest Dispute Bond / 275,000 REP) × 100`

#### Supplementary Information
- **Active Markets**: Number of markets currently in dispute
- **Dispute Round Depth**: Current escalation level of active disputes
- **Time Analysis**: Days remaining in dispute windows

### Risk Level Determination

The system assigns risk levels based directly on the fork threshold percentage:

#### Risk Level Assignment
```
if risk_percentage < 10%:    RISK_LEVEL = LOW
if risk_percentage < 25%:    RISK_LEVEL = MODERATE  
if risk_percentage < 75%:    RISK_LEVEL = HIGH
if risk_percentage >= 75%:   RISK_LEVEL = CRITICAL
```

This direct mapping provides clear, understandable risk assessment without complex multi-factor adjustments.

#### Threshold Rationale

The thresholds have been calibrated to provide meaningful risk signals:

- **Critical (≥75%)**: Fork is truly imminent - dispute bonds are close to the 275,000 REP trigger point
- **High (25-75%)**: Substantial dispute activity that warrants attention but fork is not immediate
- **Moderate (10-25%)**: Notable dispute activity above normal background levels
- **Low (<10%)**: Normal operation with minimal dispute risk

These thresholds replace previously conservative levels that would have triggered frequent false alarms during normal dispute resolution. The new levels focus attention on disputes that pose genuine systemic risk to the Augur oracle.

### Risk Levels

| Level | Fork Threshold % | Description | Color |
|-------|------------------|-------------|--------|
| **Low** | <10% | Normal operation, typical dispute activity | Green |
| **Moderate** | 10-25% | Elevated dispute activity above baseline | Yellow |
| **High** | 25-75% | Large disputes requiring close monitoring | Orange |
| **Critical** | ≥75% | Fork trigger imminent, dispute near 275K REP | Red (pulsing) |

## Data Sources and Architecture

### Blockchain Data Collection
- **Ethereum Mainnet**: Primary data source via public JSON-RPC endpoints
- **Augur v2 Contracts**: Verified contract addresses from official deployment
  - Universe: `0xe991247b78f937d7b69cfc00f1a487a293557677`
  - REPv2 Token: `0x221657776846890989a759ba2973e427dff5c9bb`
  - Augur Main: `0x75228dce4d82566d93068a8d5d49435216551599`
  - Cash (DAI): `0xd5524179cb7ae012f5b642c1d6d700bbaa76b96b`
- **Event Monitoring**: DisputeCrowdsourcerCreated, DisputeCrowdsourcerCompleted events

### Infrastructure Design
- **GitHub Actions**: Hourly automated calculations (sufficient for 7-day dispute windows)
- **Public RPC Endpoints**: No API keys required, fully transparent access
  - Primary: Ankr Public RPC (`https://rpc.ankr.com/eth`)
  - Fallbacks: LlamaRPC, LinkPool, PublicNode, 1RPC
- **Static JSON Storage**: Results saved to version-controlled JSON file
- **Audit Trail**: All calculations and changes tracked in git history
- **No Private Infrastructure**: No databases, no API keys, fully auditable

### Update Frequency
- **Calculation**: Every hour via GitHub Actions
- **UI Refresh**: Every 5 minutes (data changes hourly)
- **Manual Triggers**: Available for testing and immediate updates

### RPC Failover Strategy
The system attempts to connect to public RPC endpoints in order of preference:
1. **LlamaRPC** (`https://eth.llamarpc.com`)
2. **LinkPool** (`https://main-light.eth.linkpool.io`)
3. **PublicNode** (`https://ethereum.publicnode.com`)
4. **1RPC** (`https://1rpc.io/eth`)

Each endpoint is tested with a `getBlockNumber()` call before use. If all endpoints fail, the system reports an error state rather than falling back to mock data. Connection latency and endpoint used are logged for transparency.

## Transparency and Auditability

### Open Source Approach
1. **Calculation Script**: All logic is open source and auditable
2. **Git History**: Complete audit trail of all risk calculations
3. **Public Data**: JSON results available for external verification
4. **Methodology Documentation**: This document provides full transparency

### Verification Process
Anyone can verify calculations by:
1. Reviewing the calculation script: `scripts/calculate-fork-risk.ts`
2. Checking historical data in git commits
3. Running calculations independently using the same inputs
4. Comparing results with the published JSON data

## Limitations and Considerations

### Current Implementation Status
**✅ Fully Operational**: This version uses verified Augur v2 contract addresses and real blockchain data:

1. **Dispute Monitoring**: Real-time parsing of `DisputeCrowdsourcerCreated` events from Augur contracts
2. **Fork Threshold Calculation**: Direct comparison against the 275,000 REP threshold

### Known Limitations
1. **Limited Augur Activity**: Augur v2 on mainnet has very low activity due to high gas fees
2. **Event Parsing**: Full dispute event monitoring requires additional development

### Timing Considerations
- **Dispute Windows**: 7 days each, hourly monitoring is sufficient
- **Fork Duration**: Up to 60 days, providing ample warning time
- **Escalation Speed**: Multiple rounds required, attacks develop over days/weeks

### Risk Factors Not Captured
- **Coordination Attacks**: Difficult to detect until they occur
- **External Governance**: Changes to Augur parameters
- **Market Psychology**: REP holder behavior during stress

## Technical Implementation

### Contract Addresses (Mainnet)
```json
{
  "universe": "0xe991247b78f937d7b69cfc00f1a487a293557677",
  "augur": "0x75228dce4d82566d93068a8d5d49435216551599",
  "repToken": "0x221657776846890989a759ba2973e427dff5c9bb",
  "cash": "0xd5524179cb7ae012f5b642c1d6d700bbaa76b96b"
}
```

### Key Events Monitored
- `DisputeCrowdsourcerCreated`: New dispute bonds created
- `DisputeCrowdsourcerCompleted`: Dispute bonds filled
- `UniverseForked`: Fork has been triggered

### Calculation Schedule
```yaml
# GitHub Actions Schedule
schedule:
  - cron: '5 * * * *'  # Every hour at minute 5
workflow_dispatch:     # Manual trigger available
```

## Historical Context

### Augur's Fork History
- **Genesis Launch**: No forks have occurred in production to date
- **Theoretical Framework**: Fork mechanism designed as "nuclear option"
- **Economic Security**: Designed to make attacks prohibitively expensive

### Risk Assessment Evolution
This methodology may evolve based on:
- Actual fork events (if they occur)
- Community feedback and governance decisions  
- New attack vectors discovered
- Changes to Augur protocol parameters

## References

1. [Augur v2 Whitepaper](../docs/augur-whitepaper-v2.pdf) - Core fork mechanics
2. [Augur Documentation](https://docs.augur.net/) - Technical specifications
3. [GitHub Repository](/) - Source code and audit trail

---

**Last Updated**: August 24, 2025  
**Version**: 1.0  
**Maintained By**: Augur Fork Meter Project