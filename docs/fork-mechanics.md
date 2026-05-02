---
title: Fork Mechanics
tags: [augur, fork, protocol]
---

# Fork Mechanics

> A narrative explanation of how Augur v2 forks work, why they exist, and what the fork monitor observes.
> Facts cited from [[augur-v2-protocol-glossary]]. For the implementation, see [[fork-monitoring-methodology]].

---

## Why Forks Exist

Augur is a decentralized oracle — it determines real-world outcomes without trusted intermediaries. The core challenge: what happens when reporters disagree about what actually happened?

The answer is escalation. Disputes start small (a single reporter staking 0.35 REP) and grow exponentially through crowdsourced bonds. If no one can agree, the protocol has a final resolution mechanism: **forking**.

Forking splits REP into multiple versions, one per possible outcome. REP holders must choose which version corresponds to reality. The version with the most migration wins. Tokens in losing universes become worthless.

This is the "nuclear option" — the whitepaper calls it "the market resolution method of last resort." It's designed to be rare, disruptive, and self-correcting. The credible threat of a fork is enough to keep reporters honest in normal operation.

> **Source**: [[augur-v2-protocol-glossary]] → Fork, Security Model

---

## The Escalation Path

A market's outcome is determined through escalating stages:

```
Initial Report (designated reporter, 24h window)
    │
    ▼
Dispute Round 1 (up to 24 hours)
    │  bond size: 2 × initial stake
    ▼
Dispute Round 2 (up to 7 days)
    │  bond size grows exponentially
    ▼
Dispute Round 3 (up to 7 days)
    │
    ...
    ▼
Dispute Round 20 (maximum)
    │  bond size ≥ 275,000 REP = 2.5% of supply
    ▼
FORK
```

At each round, REP holders can dispute the tentative outcome by staking REP on a different outcome. The required bond grows exponentially — by round 20, it reaches the fork threshold.

Most markets never reach high rounds. A false tentative outcome is typically corrected in the first few rounds. The escalating bond sizes ensure that disputing becomes progressively more expensive, filtering out noise while still allowing correction of genuine errors.

> **Source**: [[augur-v2-protocol-glossary]] → Dispute Bond Mechanics, Key Constants

---

## The Bond Size Formula

The dispute bond for round *n*, disputing in favor of outcome *ω*:

> **B(ω, n) = 2A<sub>n</sub> − 3S(ω, n)**

Where *A<sub>n</sub>* is total stake across all outcomes and *S(ω, n)* is stake on the specific outcome.

This formula ensures a **fixed 40% ROI** for successful disputers. It produces exponential growth: in the worst case (two outcomes disputed back and forth), the bond at round *n* equals **3d · 2<sup>n−2</sup>** where *d* is the initial report stake (minimum 0.35 REP).

The bonds are **crowdsourced** — no single user needs to fund the entire amount. Any number of users can contribute. When the accumulated stake meets the bond size, the dispute succeeds.

> **Source**: [[augur-v2-protocol-glossary]] → Dispute Bond Mechanics

---

## What the Fork Monitor Observes

The fork monitor reads live on-chain state to answer one question:

> **How far through the escalation path is this market?**

This is measured as round progress: `(current round / estimated total rounds) × 100`. The current round is the index of the highest funded participant. The estimated total rounds is projected from the bond growth trajectory — using the last few rounds' growth factor to extrapolate when the bond would reach the fork threshold.

The monitor also computes the bond/threshold percentage `(largest dispute bond / fork threshold) × 100` for informational purposes, but the primary gauge signal and risk labels are derived from round progress. This is because the bond/threshold ratio grows exponentially while round progress is linear — a market at round 7 of ~12 is well past the halfway point, but its bond may only be ~3% of the fork threshold.

The monitor doesn't predict whether a fork will happen. It measures how far the dispute has progressed through the escalation path — a mechanical reading of the protocol's state.

> **Source**: [[augur-v2-protocol-glossary]] → Fork Trigger, Key Constants
> **Implementation**: [[fork-monitoring-methodology]]

---

## What Happens During a Fork

If a dispute bond reaches the 2.5% threshold:

1. **Fork initiated**: 60-day forking period begins. All other non-finalized markets are put on hold.
2. **Child universes created**: one per possible outcome of the forking market (e.g., Yes, No, Invalid).
3. **Parent universe locked**: no new markets, no REP staking. Trading continues in existing markets.
4. **REP migration**: holders migrate REP to the child universe they believe corresponds to reality. This is one-way and irreversible.
5. **Resolution**: whichever child universe receives the most migrated REP wins. Its outcome becomes the forking market's final outcome.
6. **Aftermath**: non-finalized markets migrate to the winning universe. REP in losing universes is expected to become worthless. Unmigrated REP is permanently locked.

The 60-day window exists to give REP holders, wallets, and exchanges time to prepare. The fork can end early if >50% of REP migrates to one universe, but the migration window stays open for the full 60 days.

> **Source**: [[augur-v2-protocol-glossary]] → Fork (Universe Creation, REP Migration, Fork Resolution)

---

## Why 20 Rounds Maximum

The whitepaper proves an upper bound:

- Minimum initial stake: 0.35 REP
- Fork threshold: 275,000 REP
- Worst-case bond growth: 3 × 0.35 × 2<sup>n−2</sup>

Solving for when this exceeds 275,000 REP:

> 3 × 0.35 × 2<sup>n−2</sup> > 275,000 → **n ≥ 20**

So any market will either finalize or cause a fork within 20 dispute rounds. In practice, most markets resolve in the first few rounds.

> **Source**: [[augur-v2-protocol-glossary]] → Key Constants (citing Appendix A, Theorem 3)

---

## The Economic Incentive Structure

The protocol is designed so that honest reporting is always the most profitable strategy:

- **Successful disputers** receive a **40% ROI** on their stake (REP in the winning universe).
- **REP staked on false outcomes** is forfeited: 20% burned, 80% redistributed to honest stakers.
- **REP in a False universe** (after a fork) is expected to have **zero market value** — no one will create markets or trade there.

The credible threat of these consequences — not the fork itself — keeps the system honest. Forks are the enforcement mechanism; normal dispute resolution is the day-to-day operation.

> **Source**: [[augur-v2-protocol-glossary]] → Settlement & Fees, Security Model

---

## Cross-References

- [[augur-v2-protocol-glossary]] — raw facts and constants cited in this document
- [[fork-monitoring-pipeline]] — the CI/CD pipeline that monitors fork proximity
- [[fork-monitoring-methodology]] — how the calculation script reads on-chain state
- [[augur-v2-whitepaper-summary]] — full synthesized read of the whitepaper
