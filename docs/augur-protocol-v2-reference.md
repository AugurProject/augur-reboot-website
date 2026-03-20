# Augur Protocol Reference

This document provides a technical reference for Augur v2 protocol mechanics, focusing on the forking system and dispute resolution process. Based on the Augur v2 whitepaper.

## Fork Trigger Conditions

A fork is initiated when a dispute bond reaches **2.5% of all theoretical REP**.

> **Note on "theoretical REP":** This is not simply the 11M token supply. Theoretical REP in a universe includes all REP that exists in that universe *plus* all REP in sibling universes that could be migrated in. In the genesis universe (before any fork), theoretical REP equals the 11M total supply, giving a fork threshold of 275,000 REP. In post-fork child universes, the threshold depends on how much REP could migrate from sibling universes.

**Key Thresholds:**
- **< 0.02% of all theoretical REP**: Market immediately enters another dispute round
- **≥ 0.02% and < 2.5% of all theoretical REP**: Market enters "waiting for window" phase (delayed dispute round)
- **≥ 2.5% of all theoretical REP**: Market triggers a fork

## Market Lifecycle

### Designated Reporting
- After market creation, the **designated reporter** has a 24-hour window to submit the initial report
- If the designated reporter fails to act, the market enters **open reporting**

### Open Reporting
- Any REP holder can submit the initial report
- The first public reporter receives the market's **creation bond** as compensation

### Invalid Outcome
- Markets can resolve as **Invalid** if the market terms are ambiguous, unverifiable, or the outcome was not known at end time
- Invalid markets pay out equally to all shares

## Fork Process Overview

### 1. Fork Initiation
- **Duration**: Up to 60 days maximum
- **Scope**: All non-finalized markets are put on hold during fork; all REP staked on non-forking markets is unstaked
- **Universe Creation**: New child universes created for each possible outcome of the forking market
- **Parent Universe**: Becomes permanently locked (no new markets, no REP staking)

### 2. REP Migration
- **One-way Process**: REP holders must migrate tokens to chosen child universe
- **Deadline**: 60 days from fork start (unmigrated REP becomes worthless)
- **Migration Window**: Even if the fork resolves early (>50% REP migrates to one universe), migration remains open until 60 days from fork initiation
- **Constraint**: REP staked on forking market outcome can only migrate to corresponding universe
- **Winner**: Child universe with most migrated REP becomes "winning universe"

### 3. Fork Resolution
- **Winning Universe**: Corresponds to the forking market's final outcome
- **Market Migration**: Non-finalized markets can only migrate to winning universe
- **Reset**: Migrated markets with initial reports reset to "waiting for window" phase

## Dispute Bond Mechanics

### Bond Size Formula
For dispute round n, outcome ω (where ω is any outcome **other than** the market's current tentative outcome):
```
B(ω, n) = 2Aₙ - 3S(ω, n)
```
Where:
- `Aₙ` = Total stake over all outcomes at beginning of round n
- `S(ω, n)` = Total stake on outcome ω at beginning of round n

### Dispute Process
1. **Crowdsourced Bonds**: Multiple users can contribute to dispute bond
2. **Success Condition**: When bond reaches required size, tentative outcome changes
3. **Stake During Rounds**: All dispute stake is held in escrow. If a dispute bond is not fully filled by the end of the round, the stake is returned to its owners.
4. **Stake at Finalization**: When a market finalizes, all REP staked on any outcome other than the final outcome is **forfeited** — 20% is burned, and the remaining 80% is distributed to users who staked on the correct outcome.
5. **ROI**: Successful disputers receive 40% ROI on their stake

## Security Model

### Market Cap Requirements
The oracle maintains integrity when:
```
Market Cap of REP ≥ 3 × Native Open Interest
```

> **Assumptions behind the 3× rule:** This threshold is derived (whitepaper Theorem 1) under specific conditions: (1) REP in the false universe becomes worthless (Pf = 0), (2) at least 50% of REP migrates to the true universe, and (3) parasitic open interest is at most half of native open interest (Ia ≥ 2Ip). If these assumptions don't hold, the required ratio changes.

### Attack Cost Analysis
- **Minimum Attack Cost**: Attacker must migrate > 50% of REP to false universe. The actual *cost* depends on the price of REP and the price differential between true/false universe REP — specifically `(P - Pf) × S × M` where P is REP price, Pf is false-universe REP price, S is the proportion migrating to true, and M is total REP.
- **Maximum Benefit**: All funds in native + parasitic markets
- **Security Assumption**: REP in false universe becomes worthless

### Market Cap Nudges
- **Target Ratio**: 5× native open interest (conservative buffer)
- **Fee Adjustment**: Reporting fees automatically adjust (0.01% - 33.3%). Default starting fee for new universes is **1%**.
- **Response Time**: Updates every 7-day dispute window
- **Fee Formula**: `max{min{(t/c)r, 333/1000}, 1/10000}` where t = target market cap, c = current market cap, r = current fee rate

## Critical Fork Mechanics

### REP Token Splitting
- **Universe Isolation**: REP in different universes are entirely separate tokens
- **Value Proposition**: Only REP in "true" universe maintains value
- **Economic Incentive**: Forces rational actors to migrate to reality-corresponding universe

### Timeline Constraints
- **Maximum Rounds**: Markets can undergo at most 20 dispute rounds before fork (derived upper bound based on minimum initial stake of 0.35 REP and the 275,000 REP fork threshold)
- **Dispute Window**: Up to 7 days per round (except first round: up to 24 hours). Rounds end early if the bond is filled before the window expires.
- **Fork Duration**: 60 days or until >50% of all theoretical REP migrates to one child universe. Migration window remains open until day 60 regardless of early resolution.

### Participation Requirements
- **Active Migration**: REP holders must actively choose universe (no default)
- **Risk Exposure**: Failure to migrate results in total loss of token value  
- **Coordination**: Honest reporters must coordinate to ensure correct universe wins

## Key Protocol Constants

### REP Supply and Thresholds
- **Total REP Supply**: 11,000,000 REP tokens (genesis universe)
- **Fork Trigger**: 2.5% of all theoretical REP (275,000 REP in genesis universe)
- **Dispute Window**: Up to 7 days (except first round: up to 24 hours)
- **Fork Duration**: 60 days maximum
- **Maximum Dispute Rounds**: ~20 rounds before fork trigger (derived upper bound)

### Bond Calculations
- **Initial Report Stake**: Minimum 0.35 REP (dynamically adjusted)
- **Dispute Bond Growth**: Exponential scaling per round
- **Successful Disputer ROI**: 40% return on staked REP
- **No-show Bond**: 0.35 REP initial, dynamically adjusted
- **Validity Bond and Creation Bond**: Required from market creators

### Participation Tokens
- REP holders can purchase **participation tokens** to earn a share of reporting fees without actively reporting on markets. This provides an alternative to active dispute participation.

## Security Considerations

### Oracle Integrity Dependencies
- REP market cap must exceed 3× open interest
- Rational economic behavior assumption
- Majority of REP holders choose reality-corresponding universe
- Parasitic market interest remains bounded

### Attack Scenarios
- **Coordinated False Reporting**: Requires majority REP control
- **Economic Manipulation**: Profits must exceed migration costs  
- **Parasitic Market Drain**: External markets reducing Augur fee income

This reference provides the essential mechanics for understanding when and how Augur forks occur, enabling accurate fork risk assessment and monitoring tools.