---
title: Augur v2 Protocol Glossary
tags: [augur, protocol, reference]
---

# Augur v2 Protocol Glossary

> Terms, constants, and formulas from the Augur v2 whitepaper, cited by section.
> Source: [Augur v2 whitepaper, release v2.0.16](https://github.com/AugurProject/whitepaper/releases/download/v2.0.16/augur-whitepaper-v2.pdf)
>
> **Related**: [[fork-mechanics]] for the narrative fork explanation. [[augur-v2-whitepaper-summary]] for a synthesized read of the full paper.

---

## Market Lifecycle

### Market Creation (Section I)

- Markets follow four stages: **creation → trading → reporting → settlement**
- Market creator sets: outcomes, end time, resolution source, creator fee
- Creator posts a **validity bond** (initial: 0.01 ETH) and a **creation bond**
- **Creation bond** = max(no-show bond, designated reporter bond)

### Designated Reporting (Section I, Fig. 2a)

- After market end time, the **designated reporter** has **24 hours** to submit the initial report
- Reports by staking REP on one of the market's possible outcomes
- Failure to report: market creator forfeits the creation bond, market enters **open reporting**
- **Initial report stake**: minimum **0.35 REP** (Appendix B)

### Open Reporting (Section I, Fig. 2b)

- Any REP holder can submit the initial report
- First reporter receives the market's creation bond as compensation

### Dispute Windows (Section I)

- Augur's reporting runs on cycles of consecutive **7-day dispute windows**
- All fees collected during a window are distributed at the end of that window
- Reporters check in once per 7-day cycle

### Dispute Rounds (Section I, Fig. 2c)

- Any REP holder can dispute the market's tentative outcome
- Duration: up to **7 days** per round (first round: up to **24 hours**)
- Dispute = staking REP on an outcome other than the tentative outcome
- Successful if total stake meets the **dispute bond size** for the current round

### Finalized (Section I, Fig. 2f)

- Market finalizes when a tentative outcome passes through a full dispute round without being successfully disputed
- Or after completion of a fork
- Once finalized, traders settle positions directly with the market

---

## Dispute Bond Mechanics

### Bond Size Formula (Section I, Eq. 1)

For dispute round *n*, outcome *ω* (where *ω* ≠ tentative outcome):

> **B(ω, n) = 2A<sub>n</sub> − 3S(ω, n)**

Where:
- *A<sub>n</sub>* = total stake over all outcomes at beginning of round *n*
- *S(ω, n)* = total stake on outcome *ω* at beginning of round *n*

> **Citation**: Whitepaper Section I, "Dispute Round", Eq. (1)

### Crowdsourced Bonds (Section I)

- Bonds need not be paid by a single user
- Any user can stake REP on an outcome other than the tentative outcome
- When any outcome accumulates enough stake to fill its bond, the tentative outcome is successfully disputed

### Dispute Outcome Thresholds (Section I)

After a successful dispute, one of three things happens based on the filled bond size as a percentage of **all theoretical REP**:

| Bond size | Result |
|-----------|--------|
| ≥ 2.5% of all theoretical REP | Market enters **fork state** |
| ≥ 0.02% but < 2.5% | New tentative outcome, market enters **waiting for window** phase |
| < 0.02% | New tentative outcome, market **immediately** enters another dispute round |

> **Citation**: Whitepaper Section I, "Dispute Round"

### Stake During Dispute Rounds

- All dispute stake is held in **escrow** during the round
- **Unsuccessful** stake: **returned** to owners at end of round
- **Successful** stake: applied to the championed outcome, remains until market is finalized (or a fork occurs in another market)
- All stake (successful or not) receives a portion of the reporting fee pool

> **Citation**: Whitepaper Section I, "Dispute Round"

---

## Fork

### Fork Trigger (Section I, Section II)

- Caused by a successfully-filled dispute bond of at least **2.5% of all theoretical REP**
- The market that triggered the fork is the **forking market**
- Forking is the "resolution method of last resort" — "the nuclear option"

> **Citation**: Whitepaper Section I, "Fork"; Section II opening paragraph

### Fork Duration (Section I, footnote 13)

- **Up to 60 days**
- Ends early if >50% of all theoretical REP migrates to one child universe
- REP in parent universe can be migrated up to 60 days after fork initiation, even if the forking period ended early

### Universe Creation (Section I)

- New **child universe** created for each possible outcome of the forking market (including Invalid)
- Example: a Yes/No market creates 3 child universes (Yes, No, Invalid)
- Initially empty — no markets or REP tokens
- **Parent universe** becomes permanently locked: no new markets, no REP staking

### REP Migration (Section I)

- **One-way**: migration cannot be reversed
- Tokens in different sibling universes are entirely separate
- REP staked on a forking market's outcome can only migrate to the **corresponding** child universe
- REP staked on non-forking markets is **automatically unstaked** at fork initiation (exception: initial reporter's stake, which auto-migrates to the winning universe)
- Unmigrated REP (still in parent after 60 days): **permanently locked, expected to lose all value**

### Fork Resolution (Section I)

- Child universe receiving the most migrated REP → **winning universe**
- Winning universe's corresponding outcome → **final outcome** of the forking market
- Non-finalized markets can migrate only to the winning universe
- Migrated markets with initial reports reset to "waiting for window" phase
- Fork outcome **cannot be disputed**

---

## All Theoretical REP (Section I, footnote 11)

> "All theoretical REP means the total theoretical supply of REP in the universe. In other words, sum of the total amount of REP which exist in the universe and the total amount of REP which exist in the other universe and can be migrated to the universe."

In the genesis universe (before any fork), all theoretical REP = 11,000,000 REP (the total supply).

---

## Settlement & Fees (Section I)

### Settlement Fees

Two fees levied when traders settle with the market contract:

1. **Creator fee**: set by market creator, paid to creator
2. **Reporting fee**: set dynamically (see Fee Adjustment below), paid to reporters

Both proportional to payout amount.

### REP Redistribution (Section I, "Reputation Redistribution")

When a market finalizes without a fork:
- All REP staked on non-final outcomes: **forfeited**
- **20% burned**, remainder distributed to users who staked on the final outcome (proportional to their stake)
- Dispute bond sizes and burn rate chosen such that successful disputers receive a **40% ROI** on their dispute stake

> **Citation**: Whitepaper Section I, "Reputation Redistribution"; Theorem 2 in Appendix A

---

## Security Model (Section II)

### Market Cap Security Theorem (Theorem 1)

The forking protocol has integrity if and only if:

> **S > ½** or **(I<sub>a</sub> + I<sub>p</sub>) · P / ((P − P<sub>f</sub>) · S) < P · M**

Where:
- *S* = proportion of REP migrated to the True universe during forking period
- *P* = price of REP
- *P<sub>f</sub>* = price of REP in the False universe (assumed 0)
- *M* = total REP
- *I<sub>a</sub>* = native open interest
- *I<sub>p</sub>* = parasitic open interest

Under assumptions (S ≥ ½, I<sub>a</sub> ≥ 2I<sub>p</sub>, P<sub>f</sub> = 0):
- **Theoretical minimum**: market cap ≥ **3×** native open interest
- **Practical target**: market cap ≥ **5×** native open interest (conservative buffer)

> **Citation**: Whitepaper Section II, Theorem 1; Section III, paragraph after "Volatility of Open Interest"

### Fee Adjustment (Section II C)

Reporting fee dynamically adjusted each dispute window:

> **max{min{(t/c) · r, 333/1000}, 1/10000}**

Where:
- *r* = reporting fee from previous window
- *t* = target market cap
- *c* = current market cap

Bounds: **0.01%** (floor) to **33.3%** (ceiling). Default for new universes: **1%**.

> **Citation**: Whitepaper Section II C

---

## Key Constants

| Constant | Value | Source |
|----------|-------|--------|
| Total REP supply | 11,000,000 REP | Whitepaper Appendix A, Theorem 3 proof |
| Fork trigger threshold | 2.5% of all theoretical REP (275,000 REP in genesis) | Section I "Fork", Appendix A |
| Low-dispute threshold | 0.02% of all theoretical REP | Section I "Dispute Round" |
| Maximum dispute rounds | ~20 (before fork or finalization) | Appendix A, Theorem 3 |
| Dispute round duration | Up to 7 days (first round: up to 24 hours) | Section I "Dispute Round" |
| Fork duration | Up to 60 days | Section I "Fork", footnote 13 |
| Successful disputer ROI | 40% on dispute stake | Section I "Reputation Redistribution", Theorem 2 |
| Initial report minimum stake | 0.35 REP | Appendix B |
| Reporting fee range | 0.01% – 33.3% | Section II C |
| Default reporting fee | 1% | Section II C |
| Market cap target | 5× native open interest | Section III |

> **Citation for 20-round maximum**: "Solving 3(0.35) · 2<sup>n−2</sup> > 275,000 for n ∈ ℤ yields n ≥ 20." — Appendix A, Theorem 3 proof

> **Citation for 275,000 REP**: "We know that forks are initiated after the successful fulfillment of a dispute bond with size at least 2.5% of all existing REP, and we know that there are 11 million REP in existence. Thus a fork is initiated when a dispute bond of size 275,000 REP is filled." — Appendix A, Theorem 3 proof

---

## Bond Size Adjustments (Appendix B)

### Validity Bond

- Initial: **0.01 ETH**
- Adjusted based on proportion *ν* of finalized markets that were Invalid in the previous window
- Target: 1% Invalid rate
- Multiplier function *f(x)*: range [½, 2]
  - If behavior at exactly 1%: no change
  - Less frequent: bond reduced up to half
  - More frequent: bond increased up to 2×

### No-Show Bond

- Initial: **0.35 REP**
- Target: 1% no-show rate, floor of 0.35 REP

### Designated Reporter Bond

- Initial: **0.35 REP**
- Target: 1% failure rate, floor of 0.35 REP

> **Citation**: Whitepaper Appendix B

---

## Market States (Summary)

| State | Description |
|-------|-------------|
| **Created** | Market exists, trading begins |
| **Designated Reporting** | 24-hour window for designated reporter |
| **Open Reporting** | Any REP holder can report (if designated reporter no-showed) |
| **Dispute Round** | Up to 7 days for REP holders to dispute tentative outcome |
| **Waiting for Window** | Between dispute rounds when bond ≥ 0.02% of theoretical REP |
| **Fork** | Up to 60 days, REP migration to child universes |
| **Finalized** | Outcome determined, traders can settle |

---

## Cross-References

- [[fork-mechanics]] — narrative explanation of the fork mechanism
- [[augur-v2-whitepaper-summary]] — synthesized summary of the full whitepaper
- [[fork-monitoring-methodology]] — how the fork monitor reads these on-chain values
