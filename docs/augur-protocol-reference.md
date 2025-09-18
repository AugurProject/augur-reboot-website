# Augur Protocol Reference

This document provides a technical reference for Augur v2 protocol mechanics, focusing on the forking system and dispute resolution process. Based on the Augur v2 whitepaper.

## Fork Trigger Conditions

A fork is initiated when a dispute bond reaches **2.5% of all theoretical REP** (275,000 REP out of 11 million total supply).

**Key Thresholds:**
- **< 0.02% of REP**: Market immediately enters another dispute round
- **0.02% - 2.5% of REP**: Market enters "waiting for window" phase (delayed dispute round)  
- **≥ 2.5% of REP**: Market triggers a fork

## Fork Process Overview

### 1. Fork Initiation
- **Duration**: Up to 60 days maximum
- **Scope**: All non-finalized markets are put on hold during fork
- **Universe Creation**: New child universes created for each possible outcome of the forking market
- **Parent Universe**: Becomes permanently locked (no new markets, no REP staking)

### 2. REP Migration
- **One-way Process**: REP holders must migrate tokens to chosen child universe
- **Deadline**: 60 days from fork start (unmigrated REP becomes worthless)
- **Constraint**: REP staked on forking market outcome can only migrate to corresponding universe
- **Winner**: Child universe with most migrated REP becomes "winning universe"

### 3. Fork Resolution
- **Winning Universe**: Corresponds to the forking market's final outcome
- **Market Migration**: Non-finalized markets can only migrate to winning universe
- **Reset**: Migrated markets with initial reports reset to "waiting for window" phase

## Dispute Bond Mechanics

### Bond Size Formula
For dispute round n, outcome ω:
```
B(ω, n) = 2Aₙ - 3S(ω, n)
```
Where:
- `Aₙ` = Total stake over all outcomes at beginning of round n
- `S(ω, n)` = Total stake on outcome ω at beginning of round n

### Dispute Process
1. **Crowdsourced Bonds**: Multiple users can contribute to dispute bond
2. **Success Condition**: When bond reaches required size, tentative outcome changes
3. **Stake Redistribution**: Successful dispute stake remains; unsuccessful stake returned
4. **ROI**: Successful disputers receive 40% ROI on their stake

## Security Model

### Market Cap Requirements
The oracle maintains integrity when:
```
Market Cap of REP ≥ 3 × Native Open Interest
```

### Attack Cost Analysis
- **Minimum Attack Cost**: Attacker must migrate > 50% of REP to false universe
- **Maximum Benefit**: All funds in native + parasitic markets
- **Security Assumption**: REP in false universe becomes worthless

### Market Cap Nudges
- **Target Ratio**: 5× native open interest (conservative buffer)
- **Fee Adjustment**: Reporting fees automatically adjust (0.01% - 33.3%)
- **Response Time**: Updates every 7-day dispute window

## Critical Fork Mechanics

### REP Token Splitting
- **Universe Isolation**: REP in different universes are entirely separate tokens
- **Value Proposition**: Only REP in "true" universe maintains value
- **Economic Incentive**: Forces rational actors to migrate to reality-corresponding universe

### Timeline Constraints
- **Maximum Rounds**: Markets can undergo at most 20 dispute rounds before fork
- **Dispute Window**: 7 days per round (except first round: 24 hours)
- **Fork Duration**: 60 days or until >50% REP migrates to one universe

### Participation Requirements
- **Active Migration**: REP holders must actively choose universe (no default)
- **Risk Exposure**: Failure to migrate results in total loss of token value  
- **Coordination**: Honest reporters must coordinate to ensure correct universe wins

## Key Protocol Constants

### REP Supply and Thresholds
- **Total REP Supply**: 11,000,000 REP tokens
- **Fork Trigger**: 275,000 REP (2.5% of total supply)
- **Dispute Window**: 7 days (except first round: 24 hours)
- **Fork Duration**: 60 days maximum
- **Maximum Dispute Rounds**: 20 rounds before fork trigger

### Bond Calculations
- **Initial Report Stake**: Minimum 0.35 REP
- **Dispute Bond Growth**: Exponential scaling per round
- **Successful Disputer ROI**: 40% return on staked REP

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