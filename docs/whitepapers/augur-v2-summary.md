# Augur v2 Whitepaper Summary

> Derived from: *Augur: a Decentralized Oracle and Prediction Market Platform (v2.0)*
> Authors: Jack Peterson, Joseph Krug, Micah Zoltu, Austin K. Williams, Stephanie Alexander
> Date: March 21, 2025 | Forecast Foundation
> See also: `docs/augur-protocol-v2-reference.md` for fork mechanics quick-reference

## Overview

Augur is a trustless, decentralized oracle **and** prediction market platform on Ethereum. It allows anyone to create markets on real-world events, trade outcome shares, and earn fees by reporting outcomes accurately. The oracle component uses economic incentives — specifically the threat of universe forking — to ensure honest reporting without any centralized authority.

REP (Reputation) is the native token (ERC777). It is used for reporting, disputing, and staking — not for trading. Traders use DAI and never need to hold REP.

## Market Lifecycle

Markets follow a four-stage progression:

1. **Creation** — Market creator defines the event, outcomes, end time, designated reporter, resolution source, and creator fee. Posts validity bond (DAI) and creation bond (REP).
2. **Trading** — Users trade outcome shares via an on-contract order book. Complete sets (one share of each outcome) are minted for 1 DAI total. Shares are ERC777 tokens tradeable at any time.
3. **Reporting** — After the event occurs, the oracle determines the outcome through designated/open reporting and dispute rounds.
4. **Settlement** — Traders redeem winning shares for DAI (minus creator fee + reporting fee).

## Market Creation

- **Market creator** sets: event end time, designated reporter, resolution source, creator fee, and outcome set
- **Resolution source**: can be "common knowledge", a specific website, an API endpoint, etc.
- **Designated reporter**: chosen by creator; has 24 hours to submit initial report after event end time
- **Validity bond** (DAI): returned if market resolves to any outcome other than Invalid. Sized dynamically based on recent invalid market proportion. Floor: 0.01 ETH equivalent.
- **Creation bond** (REP): returned if designated reporter reports on time AND market resolves to the reported outcome. Sized dynamically based on designated reporter no-show rate. Floor: 0.35 REP.
  - The creation bond is the maximum of the **no-show bond** and the **designated reporter bond**, both dynamically adjusted
- **Bond size adjustment function**: `f(x) = (100/99)x + 98/99` for `x > 1/100`; `f(x) = 50x + 1/2` for `x ≤ 1/100`. Targets 1% rate for the undesirable behavior, adjusting by up to 2× per window.

## Trading

- **Complete sets**: A bundle of one share per outcome, costing 1 DAI total. Created by Augur's matching engine when complementary orders are matched.
- **Order book**: On-contract, automated matching. Orders never execute worse than limit price but may execute better. Unfilled orders can be cancelled at any time.
- **Share tokens**: ERC777 on Ethereum. Freely tradeable at any time, including after market creation but before event occurs (the most active trading period).
- **DAI denomination**: All value is denominated in DAI. Fees are only collected at settlement.

## Reporting & Disputes

### 7 Market States

1. **Pre-reporting** — Trading phase before event occurs
2. **Designated Reporting** — 24-hour window for designated reporter
3. **Open Reporting** — Anyone can report (if designated reporter fails). First public reporter receives the forfeited creation bond as stake on their chosen outcome.
4. **Dispute Round** — Up to 24 hours (first round) or 7 days (subsequent). REP holders can dispute the tentative outcome.
5. **Waiting for Window** — Pause until next dispute window begins (when bond ≥ 0.02% but < 2.5% of theoretical REP)
6. **Fork** — Terminal dispute resolution (bond ≥ 2.5% of theoretical REP)
7. **Finalized** — Outcome is final and payouts begin

### Dispute Windows

- Consecutive 7-day windows. All fees collected during a window go to that window's reporting fee pool.
- Reporters earn fees proportional to REP staked during that window.
- **Participation tokens**: REP holders who don't actively report can purchase these (at 1 attorep = 10⁻¹⁸ REP each) to earn a pro rata share of fees. Incentivizes weekly check-in.

### Dispute Bond Formula

For dispute round n, to dispute in favor of outcome ω:

```
B(ω, n) = 2Aₙ - 3S(ω, n)
```

Where:
- `Aₙ` = total stake across all outcomes at beginning of round n
- `S(ω, n)` = total stake on outcome ω at beginning of round n

Bonds are crowdsourceable. Unfilled bonds are returned at round end. Successful dispute bonds flip the tentative outcome.

### Dispute Thresholds

- **< 0.02% of theoretical REP**: Market immediately enters next dispute round
- **≥ 0.02% and < 2.5%**: Market enters "waiting for window" (slowdown)
- **≥ 2.5% (275,000 REP in genesis universe)**: Market triggers a fork

### Maximum Dispute Rounds

A market can undergo at most **20 dispute rounds** before triggering a fork. Derived from: `3(0.35)2^(n-2) > 275,000` yields `n ≥ 20`, given minimum initial stake of 0.35 REP.

## Forking

- **Trigger**: Dispute bond reaches 2.5% of all theoretical REP (275,000 REP in genesis universe)
- **Duration**: Up to 60 days, or until >50% of theoretical REP migrates to one child universe. Migration window stays open until day 60 regardless.
- **Child universes**: One created per possible outcome (including Invalid). Initially empty.
- **Parent universe**: Permanently locked — no new markets, no staking. Trading continues but markets can't finalize.
- **REP migration**: One-way, irreversible. REP staked on the forking market's outcomes can only migrate to the corresponding universe. All other REP is unstaked and free to migrate anywhere.
- **Unmigrated REP**: Locked in parent universe after 60 days — effectively worthless.
- **Winner**: Child universe with most migrated REP. Non-finalized markets can only migrate to the winning universe.
- **Scope**: All non-finalized markets are paused. Only one fork can occur at a time.

## Settlement & Fees

### Two Settlement Fees (proportional to payout)

1. **Creator fee**: Set by market creator at creation time. Paid to creator.
2. **Reporting fee**: Set dynamically by the protocol. Paid to reporters via the reporting fee pool.

### Reputation Redistribution (non-fork finalization)

When a market finalizes without forking:
- All REP staked on incorrect outcomes is **forfeited**
- **20% burned**, **80% redistributed** to correct-outcome stakers proportional to stake
- Bond sizes ensure successful disputers receive **40% ROI** on their stake (Theorem 2)

### Reporting Fee Dynamic Adjustment

Formula per dispute window:
```
reportingFee = max{ min{ (t/c) × r, 333/1000 }, 1/10000 }
```
Where: `t` = target market cap, `c` = current market cap, `r` = current fee rate

- **Range**: 0.01% to 33.3%
- **Default** (new universe): 1%
- **Target**: Market cap of REP = 5× native open interest (conservative buffer over the 3× security minimum)
- **Update frequency**: Every 7-day dispute window

## Security Model

### Integrity Property (Theorem 1)

The forking protocol has **integrity** if and only if:
1. `S > 1/2` (more than half of REP migrates to True universe), **or**
2. `Pf < P` and market cap `PM > (Iₐ + Ip)P / ((P - Pf)S)`

### Market Cap Requirement

Under assumptions:
- `Pf = 0` (false-universe REP becomes worthless)
- `S ≥ 1/2` (at least 50% of REP migrates to True)
- `Iₐ ≥ 2Ip` (parasitic OI bounded at 50% of native OI)

Then: **Market Cap of REP ≥ 3× Native Open Interest** guarantees integrity.

The fee adjustment algorithm targets **5×** (not 3×) for a comfortable safety buffer, absorbing up to 66.6% sudden OI increases.

### Attack Cost

- Attacker must migrate >50% of REP to a False universe
- Minimum cost: `(P - Pf) × S × M` where P = REP price, Pf = false-REP price, S = true-migration proportion, M = total REP
- Maximum benefit: `Iₐ + Ip` (all native + parasitic open interest)

## Potential Issues

1. **Parasitic markets**: External markets that resolve using Augur's oracle without paying fees. Reduces fee income → downward pressure on REP market cap → threatens integrity. Provably unsolvable even for centralized systems.
2. **OI volatility**: Sudden spikes (e.g., major sporting events) can temporarily exceed the market cap safety ratio. Market cap nudges are reactive (7-day lag) but speculative REP buying may help close the gap.
3. **Malicious resolution sources**: Creator chooses a dishonest resolution source and serves as designated reporter. Can force repeated disputes. Reporters must remain vigilant and coordinate to finalize such markets as Invalid.
4. **Self-referential oracle queries**: Markets about Augur's own behavior (e.g., "Will a designated reporter fail?") can create perverse incentives. Not a security threat if market cap is sufficient, but causes delays.
5. **Uncertain fork participation**: Cannot guarantee >50% REP migration to the True universe. Security relies on the assumption of rational, self-interested behavior.
6. **Responsibility during forks**: Unlike blockchain forks, Augur forks require an active, irreversible choice. Failure to migrate = total loss. This is a necessary design feature, not a bug.
7. **Ambiguous/subjective markets**: Should resolve as Invalid. In edge cases where reasonable reporters disagree, multiple child universes may retain non-zero value after a fork.

## Key Constants

| Constant | Value |
|---|---|
| Total REP Supply (genesis) | 11,000,000 REP |
| Fork Threshold | 2.5% of theoretical REP (275,000 in genesis) |
| Slowdown Threshold | 0.02% of theoretical REP |
| Fork Duration | 60 days maximum |
| Designated Reporting Window | 24 hours |
| Dispute Window | 7 days (first round: 24 hours) |
| Maximum Dispute Rounds | ~20 (derived upper bound) |
| Successful Disputer ROI | 40% |
| REP Burn on Finalization | 20% of forfeited stake |
| REP Redistribution | 80% of forfeited stake |
| Reporting Fee Range | 0.01% – 33.3% |
| Default Reporting Fee | 1% |
| Target Market Cap Ratio | 5× native OI |
| Security Minimum Ratio | 3× native OI |
| Initial No-show Bond | 0.35 REP |
| Initial Validity Bond | 0.01 ETH |
| Minimum Initial Stake | 0.35 REP |
| 1 attorep | 10⁻¹⁸ REP |
