# Lituus Whitepaper Summary

> Derived from: *A Bribery-Resistant Group-Strategyproof Oracle*
> Authors: Ryan Garner, Philip Monastirsky
> Date: January 2026
> Cites Augur v2 whitepaper as reference [9]

## Overview

Lituus is a **standalone, decentralized oracle** — not a prediction market platform. It publishes truth for permissionless use by third parties: prediction markets, DeFi systems, and any protocol that needs to outsource resolution to a reliable oracle.

The core mechanism is **MBUFSR** (Migration-Based Universe Forking with Supply Restoration), which establishes truth-telling as a strictly dominant strategy equilibrium. The estimated attack cost is **~134% of the fully diluted valuation (FDV)** of the voting asset under plausible parameters — the highest of any surveyed oracle design.

The protocol uses REP as a revenue-correlated asset. REP is used for all value transfers: reporting, disputing, Query fees, reporter pay, and protocol earnings.

## Relationship to Augur v2

Lituus **extracts and generalizes the oracle** from Augur v2:
- v2 = prediction market platform with integrated oracle
- Lituus = oracle only, designed as infrastructure for any dependent protocol
- Upgrades the security mechanism from MBUF to MBUFSR (adds supply restoration)
- Replaces designated reporting with open reporting via clock auction
- Replaces market-specific bonds with a unified Query Fee
- Replaces reactive market-cap nudges with a proactive Query Fee controller

## Core Concept: MBUFSR

**Migration-Based Universe Forking with Supply Restoration**

The key insight: when an attacker migrates REP to a fraudulent fork, the remaining holders' proportional ownership increases. The protocol exploits this by:
1. Minting new REP equal to the supply decrease of the most popular fork
2. Auctioning the minted REP
3. Requiring the auctioned REP to migrate to a fork

This forces the attacker to buy and destroy ~50% of the supply **twice** — first in the initial migration, then again during supply restoration. The result is an attack cost exceeding 100% FDV, making dishonesty economically devastating.

Truth-telling is a **strictly dominant strategy**: rational participants always receive the greatest payoff by migrating to the fork that best matches ground truth, even when external incentives exist.

## Protocol Flow

### End-to-End Resolution

1. **Query creation**: Anyone submits a multiple-choice question + Query Fee (in REP)
2. **Open reporting**: Clock auction starts reporter pay at 0 REP, linearly increasing to the full Query Fee over a configurable time. First reporter to accept places a bond equal to the Query Fee on their chosen outcome.
3. **Appeal period**: If no one disputes, the report becomes final.
4. **Escalation game**: If disputed, sequential staking begins with doubling bonds on alternate outcomes.
5. **Fork backstop**: If escalation bonds reach the fork threshold, the forking game begins.
6. **Final outcome**: Determined and published as immutable oracle output.

### 3 Finalization Paths

1. **First Report** (no appeal): Reporter's bond is returned + reporter receives Reporter Pay portion of the Query Fee. Remainder burned.
2. **Most Recent Report** (escalation, no fork): Last undisputed tentative outcome wins. All bonds reallocated to reporters who reported the final outcome. First correct reporter gets Reporter Pay. Remainder burned.
3. **Most Migration** (fork): Universe with most migrated REP wins. Escalation game participants receive 40% ROI in the REP of their universe. All stakes paid out, but only honest universe retains long-term value.

If no reporter submits within the resolution period, the Query resolves as **Invalid** — whoever closes it receives part of the Query Fee (remainder burned).

## Escalation Game

The escalation game is the dispute resolution mechanism below the fork threshold:

- **Initial stake**: Equal to the Query Fee, placed on reporter's chosen outcome
- **Each subsequent stake**: Must be placed on a **different** outcome and be **2× the previous bond**
- **Appeal period**: Configurable time window. If no dispute, the tentative outcome (most recent stake) becomes final.
- **Bond doubling**: Creates exponentially increasing cost to sustain a false outcome
- **20% fee on winnings**: When the escalation game resolves without forking, 80% of losing-side stakes go to winners proportional to stake; 20% is burned as profit. This fee prevents byzantine attacks that delay resolution at no cost by appealing one's own reports.
- **Crowdsourceable**: Bonds can be filled by multiple participants
- **Analogy**: Lower courts → appeals → supreme court (fork)

## Forking Game

### Fork Threshold

- Configurable parameter: percentage of entire REP supply
- **Plausible range**: 0.5% to 4%
- Too low → frivolous forks; too high → honest parties can't gather enough to contest

### Migration (Stage 1)

- One child universe created per outcome of the disputed Query
- **Mandatory**: Every REP holder must choose an outcome or lose their REP permanently
- **One-way**: Migration is irreversible
- Legacy (unmigrated) REP loses value
- **Time frame**: Weeks (suggested) to maximize participation and security margin
- REP staked in the escalation game is refunded and must also migrate
- Exception: Query Fees and escalation stakes on the forking Query split into every fork (so payouts can occur in each universe)
- Queries can still be created during the fork if directed to a specific child

### Supply Restoration (Stage 2)

- After migration, the protocol mints new REP equal to the supply decrease of the most popular fork
- New REP is **auctioned** (sold for a different asset)
- Auctioned REP must then **migrate** to a fork
- If supply still not restored (multiple forks), the process repeats — each repeat increases security margin by half the previous increment
- Series: `1/2 + 1/4 + 1/8 + ...` converges to 1, so total additional minted investment equals the initial minted investment
- **Shareholders are not diluted**: minted amount exactly equals the supply decrease caused by the attacker
- **Auction proceeds**: Used to subsidize legitimate use (reimburse blockchain transaction costs), increasing FDV. 90% of costs reimbursed until fund exhausted.

### Winning the Fork

The fork with the **most total migration** (initial + auctioned) wins. Its associated outcome becomes the Final Outcome. The original protocol forwards all interactions to the winning fork for backwards compatibility.

## Fee Economics

### Query Fee Controller

A hill-climbing feedback controller that maximizes monthly profit (REP burned):

- Monitors expected REP destroyed each month
- Rule: if a fee change results in more REP destroyed, shift further in that direction; otherwise reverse
- **Convergence rate**: ~10% per month toward optimal fee
- **Equilibrium**: When controller alternates between increase/decrease — roughly when a 1% fee increase would cause 1% fewer Queries

### Query Fee Coefficient (Volume Stabilizer)

Adjusts the fee based on recent vs. historical Query creation volume:

```
R = 20 × (queriesCreated.previous3days) / (queriesCreated.previous63Days - queriesCreated.previous3days)
```

Price modifier M:
```
M = 1 / (1 + 100(1-R)^6)    for R ≤ 1
M = 0.8 + 0.2R              for R > 1
```

- R < 1 (volume drop): non-linear discount. 50% volume decline → 61% discount. 67% decline → 90% discount.
- R > 1 (volume surge): linear increase. 200% volume → 120% fee.
- **3-day recent window**: Quick detection of demand drops
- **60-day historical window**: Mitigates overreactions to natural growth
- Final Protocol Query Fee = controller base output × M

### Reporter Pay (Clock Auction)

- When a Query is posted, reporter reward starts at **0 REP**
- Linearly increases to the **full Query Fee** over a configurable time period
- First reporter to accept claims the current offered amount
- Creates competition for lowest possible reporter payment
- Tips: Anyone can add a tip at any time to increase reporter pay and speed up reporting

### Profit Mechanism

- Portion of Query Fee not paid to reporter is **burned**
- Burning reduces total REP supply → increases value per token
- Expected continued supply reduction gives REP its market value
- Security scales with market capitalization, so maximizing burn maximizes security

## Query Tokens

Tokenized right to create a future Query at a known price:

- **Price**: Current Query Fee + **10% premium** (all in REP)
- REP deposited into a separate, immutable Query Token protocol (not the oracle directly)
- Protocol collectively backs all outstanding tokens: average REP per token = total pooled REP / number of tokens
- **Redemption**: Holder destroys token → protocol creates a normal Query on their behalf, paying the average pooled REP as the Query Fee
- **Fork behavior**: Query Tokens must migrate to a single fork. Token holders declare which fork. Unmigrated tokens are destroyed with their associated REP.
- 10% premium = Query Fee controller's maximum monthly adjustment rate, discouraging speculative minting to arbitrage anticipated fee hikes

## Oracle Security Survey

The paper surveys 4 classes of decentralized oracles, deriving security margin formulas for each. Security margin = attack cost / natural FDV.

### 1. Schelling Point (SP)

Used by: UMA, Kleros V1, Tellor, Band, Entangle

```
securityMargin(SP) = 0.5 × responsiveREP × premium × (1 - attackedValuation)
```

Estimated: **~26% FDV** (with plausible parameters)

Theoretically 0% in frictionless markets (attacker can hedge via shorting). Real-world frictions (trading costs, counterparty scarcity, anticipated price decline) bring it to ~26%.

With **social recovery** (credible threat to manually fork and destroy attacker shares): ~73% FDV. Requires rational participants with complete information.

### 2. Price-Based Universe Forking (PBUF)

```
securityMargin(PBUF) = responsiveREP × attackedValuation × (1 - 2 × falseMarketShare)
```

Estimated: **~58% FDV**

Every share splits into one share per fork. Fork with highest market price wins. Attacker must buy false-REP at true-REP prices.

### 3. Migration-Based Universe Forking (MBUF)

Used by: Augur V2. Also Kleros V2 and Eigenlayer (without mandatory migration).

```
securityMargin(MBUF) = 0.5 × premium - falseMarketShare × attackedValuation × (1 - 2 × falseMarketShare)
```

Estimated: **~92% FDV**

Mandatory migration destroys unresponsive REP, creating an `unresponsivePriceAdjustment = 1/responsiveREP` that artificially increases FDV and attack cost.

Without mandatory migration (Kleros V2, Eigenlayer):
```
securityMargin(MBUF w/o mandatory) = responsiveREP × securityMargin(MBUF)
```
Estimated: ~83% FDV.

### 4. Migration-Based Universe Forking with Supply Restoration (MBUFSR)

Used by: Lituus

```
securityMargin(MBUFSR) =
  (0.5 - falseMarketShare) × responsiveREP × premium
  + (auctionEfficiency(1 - responsiveREP/2) - falseMarketShare)
  × (quadratic formula involving subsidyDiscount, attackedValuation,
     responsiveREP, auctionEfficiency, falseMarketShare)
```

Full transcendental formula (from Appendix 6):
```
securityMargin(MBUFSR) =
  (0.5 - falseMarketShare) · responsiveREP · premium
  + (auctionEfficiency·(1 - responsiveREP/2) - falseMarketShare)
  × ( -[1-(1-fMS)·aV·(1/sD - 1)·(2-rREP)·aE - (1-fMS)·(2-rREP)·aE] + root )
    / ( 2·(1/sD - 1)·(2-rREP)·aE )

where root = √[ [1-(1-fMS)·aV·(1/sD-1)·(2-rREP)·aE - (1-fMS)·(2-rREP)·aE]²
              + 4·(1/sD-1)·(2-rREP)·aE·(1-fMS)·aV ]
```

(fMS=falseMarketShare, aV=attackedValuation, sD=subsidyDiscount, rREP=responsiveREP, aE=auctionEfficiency)

Estimated: **~134% FDV**

### Formal Proofs

- **MBUF ≥ SP** always (Appendix 8). Equal only when attackedValuation=0 and responsiveREP=1.
- **MBUFSR > SP** under complete information and rationality (Appendix 9). Under plausible ranges (Appendix 10), minimum difference = 0.204 > 0.
- **MBUFSR > MBUF** under complete information and rationality (Appendix 11).

## Parameter Assumptions

| Parameter | Possible Range | Plausible Range | Most Likely |
|---|---|---|---|
| attackedValuation | [0, 1] | [0.5, 1] | 0.7 |
| subsidyDiscount | (0, 1) | [0.08, 0.94] | 0.52 |
| responsiveREP | [0, 1] | [0.7, 1] | 0.9 |
| auctionEfficiency | (0, 1) | [0.7, 0.99] | 0.9 |
| premium | [1, ∞) | [1.07, 5.3] | 1.9 |
| falseMarketShare | [0, 0.5) | [0, 0.15] | 0.04 |

## Attack Analysis

### External Incentive to Attack

Attacks are only rational when gains **outside** the oracle (from manipulated financial contracts) exceed the in-protocol losses. The external incentive = net value extractable from financial contracts contingent on the oracle's output.

**Vulnerable open interest**: The total value an attacker can acquire by causing the oracle to resolve favorably. Effective attacker motive is 60-90% of total open interest (due to starting price of least likely outcome, large-purchase premiums, and holder refusal to sell).

### Preventing Attacks

Two regimes:
1. **REP market cap >> vulnerable OI × security margin**: Attacks inherently infeasible
2. **Self-limiting regime**: Vulnerable OI rationally self-limits below the attack threshold

### Incomplete Information Attacks (6 conditions, all required)

1. Substantial hidden vulnerable OI exists (unknown to most participants)
2. Participants significantly underestimate hidden vulnerable OI
3. Hidden OI is dispersed across multiple independent parties, each unaware of others
4. Hidden OI allows an external attacker to acquire positions within those contracts
5. Attacker knows hidden vulnerable OI is significantly greater than others' estimates
6. Attacker has wealth > attack cost + cost of purchasing the unlikely side of vulnerable contracts

Mitigation: Community-maintained dashboard aggregating visible vulnerable OI + estimates of hidden amounts. Real-time warnings when conditions approach attack viability.

### Friction Attacks

Assumption: vulnerable OI can contract as quickly as REP price drops. In practice, friction causes delayed reactions. Mitigated by:
- Attacker buying in advance suffers price crash losses
- Buying quickly after a crash is limited by liquidity and causes price impact
- Risk aversion keeps OI somewhat below threshold as a safety buffer

## Ground Truth Alignment

The paper argues universe-forking oracles align to ground truth better than centralized or Schelling-point systems. The argument rests on 5 assumptions:

1. **WoC (Wisdom of Crowds) hypothesis**: Aggregated judgment of a diverse, independent group surpasses any individual. Supported by theoretical (law of large numbers, diversity prediction theorem) and empirical evidence (1906 ox weight, ICO analyst ratings, Estimize earnings forecasting).

2. **Truth preference**: Customers prefer a provider that historically issues judgments they believe are ground truth, because unexpected judgments create payoff variability harmful to risk-averse users.

3. **Correct majority**: A majority of future oracle customers can discern ground truth. Even when this breaks, three additional conditions must hold for a centralized oracle to outperform.

4. **Network preference**: Customers prefer providers with more customers (counterparty availability, security correlation with popularity). Creates a bias toward the more popular fork.

5. **Diversity**: Shareholders, customers, and the broader market have sufficiently diverse perspectives to satisfy WoC conditions.

The chain of consequences: correct majority → future revenue flows to ground truth fork → market values ground truth fork higher → shareholders migrate to ground truth → reporters report ground truth (knowing deviation triggers profitable escalation against them).
