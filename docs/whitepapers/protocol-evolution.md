# Protocol Evolution: Augur v2 → Lituus

> Comparative analysis derived from reading both the Augur v2 whitepaper (Peterson et al., March 2025) and the Lituus whitepaper (Garner & Monastirsky, January 2026).

## Overview

Augur v2 built a **prediction market platform with an integrated oracle**. Lituus extracts that oracle, upgrades its security mechanism, and redesigns it as **standalone infrastructure** for any protocol that needs decentralized truth. The core innovation — universe forking as a dispute backstop — carries forward, but nearly every surrounding mechanism is redesigned for the oracle-as-a-service use case.

## Scope Evolution

| | Augur v2 | Lituus |
|---|---|---|
| **Purpose** | Prediction market platform + oracle | Standalone oracle |
| **Users** | Traders + reporters | Any dependent protocol (prediction markets, DeFi, insurance, governance) |
| **Unit of work** | Market (with trading, shares, settlement) | Query (question + outcomes + fee) |
| **Trading system** | Built-in order book, complete sets, ERC777 shares, DAI denomination | None — external protocols handle their own trading |
| **Revenue model** | Creator fee + reporting fee on settlement | Query Fee (burned for protocol profit) |
| **Dependent systems** | Self-contained | Designed for external integration; original protocol forwards to winning fork for backwards compatibility |

## Oracle Mechanism Upgrade: MBUF → MBUFSR

### What Changed

**MBUF** (Augur v2): Mandatory one-way migration destroys unresponsive REP and forces the attacker to acquire >50% of responsive supply. Security margin: **~92% FDV**.

**MBUFSR** (Lituus): After migration, the protocol **mints REP equal to the supply decrease** of the most popular fork, **auctions** it, and requires the auctioned REP to also **migrate**. If the attacker still holds majority, the process repeats (each repeat adds half the previous security increment).

### Why It Matters

The supply restoration forces the attacker to buy and destroy ~50% of the supply **twice**:
1. First purchase: Initial migration to the false fork (~50% of responsive supply at a premium)
2. Second purchase: During supply restoration auction, must buy ~50% of newly minted supply to maintain majority

This pushes the attack cost above 100% FDV — the attacker must spend more than the entire protocol is worth. Under plausible parameters: **~134% FDV** vs. 92% for MBUF.

### Non-Dilutive Design

Shareholders are not diluted because the minted amount exactly equals the supply removed by the attacker's migration. The auction proceeds fund a subsidy (blockchain cost reimbursement) that increases the FDV of the winning fork, further raising the cost of the next restoration round.

## Resolution Process Changes

| Aspect | Augur v2 | Lituus |
|---|---|---|
| **Terminology** | Markets | Queries |
| **Initial reporting** | Designated reporter (24h window), then open reporting if no-show | Open reporting only — clock auction for reporter pay |
| **Reporter selection** | Creator chooses designated reporter | Competitive — first reporter to accept the clock auction price |
| **Reporter incentive** | Creation bond (if designated reports correctly) | Reporter Pay portion of Query Fee (via clock auction) |
| **Initial bond** | Minimum 0.35 REP (dynamic) | Equal to the Query Fee |
| **Dispute mechanism** | Crowdsourced bonds, formula `B(ω,n) = 2Aₙ - 3S(ω,n)` | Sequential staking, each bond = 2× previous, on alternating outcomes |
| **Dispute windows** | 7-day windows (first round: 24h) | Configurable appeal periods |
| **Fork trigger** | 2.5% of theoretical REP (fixed) | Configurable fork threshold (0.5%–4% of REP supply) |
| **Validity bonds** | Paid in DAI by market creator | None — Query Fee covers all costs |
| **Creation bonds** | Paid in REP by market creator | None — replaced by Query Fee |
| **Participation tokens** | REP holders buy to earn fee share without active reporting | None — fee is burned, not distributed |
| **Finalization paths** | 2: dispute resolution or fork | 3: first report, most recent report (escalation), most migration (fork) |
| **Invalid resolution** | Reported by reporters, equal payout to all shares | Auto-resolves if no reporter submits within resolution period |

### Key Design Rationale

**Why remove designated reporters?** Designated reporters create an attack vector: the market creator can be the designated reporter, choose a malicious resolution source, and force repeated disputes. The clock auction eliminates this by making reporter selection competitive and trust-minimized.

**Why the 20% burn on escalation winnings?** Without it, an attacker could appeal their own reports repeatedly at zero net cost (they'd get all the stake back). The 20% fee makes every escalation round costly for both sides, preventing infinite delay attacks.

## Fee Model Redesign

### Augur v2: Reactive Market Cap Nudges

- Two fees at settlement: creator fee (fixed) + reporting fee (dynamic)
- Reporting fee adjusts via formula: `max{min{(t/c)r, 333/1000}, 1/10000}`
- Target: market cap = 5× native OI
- **Update frequency**: Every 7-day dispute window
- **Limitation**: Reactive — only adjusts after market cap diverges from target
- Reporting fees distributed to REP stakers proportional to participation

### Lituus: Proactive Query Fee Controller

- Single fee: Query Fee (paid in REP at Query creation)
- Hill-climbing controller maximizes monthly REP burn (profit)
- **Convergence**: ~10% per month toward optimal fee level
- **Volume coefficient** (M): Adjusts for sudden demand changes using 3-day vs. 60-day volume ratio
  - `M = 1/(1+100(1-R)^6)` for R≤1 (nonlinear discount on volume drops)
  - `M = 0.8 + 0.2R` for R>1 (linear increase on volume surges)
- **No external price dependency**: Operates solely on REP burn quantity, avoiding oracle-for-the-oracle problems
- Fee burned (not distributed) → profit accrues via supply reduction → higher REP value → higher security margin

### Design Philosophy Shift

v2 tried to **maintain a safe market cap ratio** by adjusting fees to influence REP price. Lituus instead **maximizes profit** (REP burn), trusting that maximizing burn maximizes market cap and therefore security. The volume coefficient handles short-term demand shocks that the hill-climbing controller is too slow to catch.

## Security Improvements

### Side-by-Side Comparison (Same Parameters)

Using plausible parameters: attackedValuation=0.7, responsiveREP=0.9, premium=1.9, falseMarketShare=0.04, auctionEfficiency=0.9, subsidyDiscount=0.52:

| Oracle Class | Security Margin | Example Protocols |
|---|---|---|
| SP (Schelling Point) | ~26% FDV | UMA, Kleros V1, Tellor, Band, Entangle |
| SP + social recovery | ~73% FDV | — |
| PBUF (Price-Based Forking) | ~58% FDV | — |
| MBUF (Migration-Based Forking) | ~92% FDV | Augur V2 |
| MBUF w/o mandatory migration | ~83% FDV | Kleros V2, Eigenlayer |
| **MBUFSR** | **~134% FDV** | **Lituus** |

### Why MBUFSR Is Strictly More Secure

Under complete information and rationality (falseMarketShare=0, responsiveREP=1, attackedValuation=1):
- **MBUFSR > SP**: Proven in Appendix 9. Always strictly greater.
- **MBUFSR > MBUF**: Proven in Appendix 11. The supply restoration adds a positive term that is always non-zero when subsidyDiscount and auctionEfficiency are positive.

Under plausible parameter ranges:
- **MBUFSR > SP**: Proven in Appendix 10. Minimum difference = 0.204 at the edge of plausible ranges.
- **MBUF > SP**: Appendix 8. Equal only at the boundary (attackedValuation=0, responsiveREP=1).

The improvement comes from the supply restoration mechanism creating a **recursive cost**: each restoration round forces the attacker to spend more, and the subsidy from auction proceeds increases the FDV, making subsequent rounds even more expensive.

## What Carries Forward

Despite the extensive redesign, the core intellectual foundation is preserved:

1. **Universe forking** as the ultimate dispute resolution mechanism — the "nuclear option" that makes the threat of forking credible
2. **REP as a revenue-correlated asset** — its value depends on continued honest operation and fee generation
3. **One-way, mandatory migration** — forces every REP holder to make an irreversible commitment, ensuring skin in the game
4. **Dispute escalation with doubling bonds** — exponentially increasing cost to maintain a false outcome, ensuring most disputes resolve well before a fork
5. **Truth via market incentives** — the market determines which fork/universe has value, not any governance mechanism or vote. Ground truth emerges from the aggregate judgment of participants with financial stakes.
6. **40% ROI for correct disputers** — maintained as the reward for successful dispute participation
7. **20% burn / 80% redistribution** of losing-side stakes in non-fork resolution
8. **Invalid as an explicit outcome** — preserved for malformed, ambiguous, or unresolvable queries
