# II. INCENTIVES AND SECURITY

There is a strong relationship between the market cap of REP and the trustworthiness of Augur’s forking protocol. If the market cap of REP is large enough[^16], and attackers are economically rational, then the outcome that wins the fork should correspond to objective reality. In fact, it would be possible for Augur to function properly without using designated reporters and dispute rounds. Using only the forking process, the oracle would report truthfully. However, forks are disruptive and time consuming. A fork takes up to 60 days to resolve a single market, and can resolve only one market at a time. During the 60 days in which the forking market is being resolved, all other non-finalized markets are put on hold.[^17] Service providers have to update, and REP holders have to migrate their REP to one of the new child universes. Therefore, forks should be used only when they are absolutely necessary. Forking is the nuclear option. Fortunately, once it has been established that forks can be trusted to determine truth, incentives can be used to encourage participants to behave honestly without having to actually initiate a fork. It is the credible threat of a fork, and the belief that the fork will resolve correctly, that are the cornerstones of Augur’s incentive system. Next, we discuss the conditions under which the forking system can be trusted to determine truth. We then discuss the incentive system and how it encourages quick and correct resolution of all markets.

## A. Integrity of the Forking Protocol

Here we discuss the reliability of the forking process and the conditions under which it can be trusted. For ease of discussion, when referring to forks, we will refer to the child universe that corresponds to objective reality as the True universe, and any other child universe as a False universe. We will refer to the child universe which receives the most REP migration during the forking period as the winning universe and all other child universes as losing universes. Naturally, we always want the True universe to be the winning universe, and the False universes to be the losing universes. We say that the forking protocol has been successfully attacked whenever a False universe ends up being the winning universe of a fork – thus resulting in the forking market (and, potentially, all non-finalized markets) being paid out incorrectly. Our approach to securing the oracle is to arrange matters such that the maximum benefit to a successful attacker is less than the minimum cost of performing the attack. We formalize this below.

### 1. Maximum Benefit to an Attacker

An attacker who successfully attacks the oracle would cause all non-finalized Augur markets to migrate to a False universe. If the attacker controls the majority of REP in the False universe, the attacker can then force all non-finalized markets to resolve however she wants. In the most extreme case, she would also be able to capture all funds escrowed in all of those markets.[^18]

**Definition 1.** We define, and denote by $I_a$, Augur’s native open interest as the value of the sum of all funds escrowed in unfinalized Augur markets.[^19]

**Definition 2.** We define a parasitic market as any market that does not pay reporting fees to Augur, but does resolve in accordance with the resolution of a native Augur market.

**Definition 3.** We define, and denote by $I_p$, the parasitic open interest as the value of the sum of all funds escrowed in all parasitic markets that resolve in accordance to nonfinalized, native Augur markets. In the most extreme case, an attacker would also be able to capture all funds in all parasitic markets which resolve in accordance to non-finalized, native Augur markets.

**Observation 1.** The maximum (gross) benefit to an attacker who successfully attacks the oracle is $I_a + I_p$.

### 2. Parasitic Open Interest is Unknowable

Augur can accurately and efficiently measure $I_a$. However, $I_p$ cannot be known in general, as there may exist arbitrarily many offline parasitic markets, each with arbitrarily large open interest. Since the maximum possible benefit to an attacker includes the unknowable quantity $I_p$, one can never be objectively certain that the oracle is secure against economically rational attackers.[^20] However, if we are willing to assert that $I_p$ is reasonably bounded in practice, then we can define conditions under which we may assert that the oracle is secure.

### 3. Minimum Cost of a Successful Attack

Next, consider the cost of attacking the oracle. Let $P$ denote the price of REP. Let $\epsilon$ denote one attorep[^21]. Let $M$ denote the total amount of REP in existence (the “money supply” of REP). Let $S$ denote the proportion of $M$ that will be migrated to the True universe during the forking period of a fork. Thus the product $SM$ represents the absolute amount of REP migrated to the True universe during the forking period of a fork, and the product $PM$ is the market cap of REP. Let $P_f$ denote the price of REP migrated to a False universe of the attacker’s choosing. Note that if $P \le P_f$ then the oracle would not be secure against economically rational attackers, because it would be at least as profitable to migrate REP to the False universe as it would be to not migrate at all.

### 4. Integrity

**Assumption 1.** Reporters that are not attackers will never migrate REP to a False universe during a fork.[^22] By design, a successful attack on the oracle requires more REP to be migrated to some False universe than to the True universe during the forking period of a fork. By assumption, only the attacker will migrate REP to a False universe. The amount of REP migrated to the True universe during the forking period is denoted by $SM$. Thus, for an attacker to be successful, they must migrate at least $SM + \epsilon$ REP. For simplicity, we will ignore the negligible $\epsilon$, and say that a successful attack requires migrating at least $SM$ REP, which has a value of $SMP$ before the migration, to some False universe. If an attacker migrates $SM$ REP during the forking period of a fork, they will receive $SM$ REP on the child universe to which they migrate. If the attacker migrates to a False universe then the value of those coins becomes $SMP_f$. Thus the minimum cost to the attacker is $(P-P_f)SM$.

**Observation 2.** The minimum amount of REP a successful attacker must migrate to a False universe during a fork is $SM$, which costs the attacker $(P-P_f)SM$. Note that if $S > \frac{1}{2}$ then an attack is impossible because there does not exist enough REP outside of the True universe for any False universe to become the winning universe. Pitted against economically rational attackers, the oracle will resolve to outcomes that correspond to objective reality if the maximum benefit to an attacker is less than the minimum cost of attack. By observations 1 & 2 we can see that this occurs whenever $S > \frac{1}{2}$ or $I_a + I_p < (P-P_f)SM$. This gives us our formal definition of integrity.

**Definition 4.** (Integrity Property) The forking protocol has integrity whenever $S > \frac{1}{2}$ or whenever $I_a + I_p < (P-P_f)SM$. The above inequality can be solved for $PM$ to see the relationship between forking protocol integrity and the market cap of REP.

**Theorem 1.** (Market Cap Security Theorem) The forking protocol has integrity if and only if:

1. $S > \frac{1}{2}$, or
2. $P_f < P$ and the market cap of REP is greater than

$$
\frac{(I_a+I_p)P}{(P-P_f)S}.
$$

**Proof.** Suppose the forking protocol has integrity. Then, by definition, $S > \frac{1}{2}$ or $I_a + I_p < (P-P_f)SM$. Suppose $I_a+I_p < (P-P_f)SM$. Since $I_a+I_p \ge 0$ and $SM > 0$, we know that $P_f < P$. Then, solving $I_a + I_p < (P-P_f)SM$ for $PM$, we see that

$$
\frac{(I_a+I_p)P}{(P-P_f)S} < PM.
$$

Thus the first direction is proved. Now suppose that $S > \frac{1}{2}$, or that $P_f < P$ and

$$
\frac{(I_a+I_p)P}{(P-P_f)S} < PM.
$$

If $S > \frac{1}{2}$, then the forking protocol has integrity by definition. If $P_f < P$ and the displayed inequality holds, then, solving the inequality for $I_a + I_p$, we see that $I_a + I_p < (P-P_f)SM$, and the forking protocol has integrity.

## B. Our Assumptions and Their Consequences

We believe traders will not want to trade on Augur in a universe where reporters have lied. We also believe that market creators will not pay to create Augur markets in a universe where there are no traders. In a universe without markets or trading, REP does not provide any dividends to those holding it. Therefore, we believe REP sent to a False universe will hold no non-negligible market value and we model this by letting $P_f=0$. An attacker should never migrate more than 50% of all theoretical REP (plus on attorep) to a false universe[^23]. We believe that approximately all theoretical REP will be migrated out of the parent universe during a forking period, because failure to do so is expected to result in loss of token value for no benefit. Therefore, we think it is reasonable to expect at least 50% of REP (minus one attorep) to be migrated to the True outcome during the forking period of a fork, and we model this by letting $S \ge \frac{1}{2}$. We are also willing to accommodate parasitic open interest as large as 50% of the native open interest, and so we let $I_a \ge 2I_p$. Under these assumptions, Theorem 1 tells us that the forking protocol has integrity whenever the market cap of REP is at least 3 times the native open interest.

## C. Market Cap Nudges

Augur gets information about the price of REP via a collection of trusted third-party price oracles[^24]. This gives Augur the ability to compute the current market cap of REP. Augur can also measure the current native open interest, and can thus determine what market cap ought to be targeted in order to meet Augur’s integrity requirements. Every universe begins with a default reporting fee of 1%. If the current market cap is below the target, then reporting fees are automatically increased (but will never be higher than 33.3%), putting upward pressure on the price of REP and/or downward pressure on new native open interest. If the current market cap is above the target, then reporting fees are automatically decreased (but will never be lower than 0.01%) so that traders are not paying more than needed to keep the system secure. The reporting fees are determined as follows. Let r be the reporting fee from the previous window, let t be the target market cap, and let c be the current market cap. Then the reporting fee for the current dispute window is given by

$$
\max\left\{\min\left\{\frac{t}{c}r,\frac{333}{1000}\right\},\frac{1}{10{,}000}\right\}.
$$

## D. Leveraging the Threat of a Fork

As mentioned above, forks are a disruptive and slow way for markets to reach finalization. Rather than using the forking process to resolve every market, Augur leverages the threat of a fork to resolve markets efficiently [11]. Recall that any stake successfully disputing an outcome in favor of the market’s final outcome will receive a 40% ROI on their dispute stake.[^25] In the event of a fork, any REP staked on any of the market’s false outcomes should lose all economic value, while any REP staked on the market’s true outcome is rewarded with 40% more REP in the child universe that corresponds to the market’s true outcome (regardless of the outcome of the fork). Therefore, if pushed to a fork, REP holders who dispute false outcomes in favor of true outcomes will always come out ahead, while REP holders who staked on false outcomes will see their REP lose all economic value. We believe this situation is sufficient to guarantee that all false tentative outcomes will be successfully disputed.

[^16]: See Section II.A for details.
[^17]: Traders can continue trading on those markets, but those markets cannot finalize until after the forking period.
[^18]: This would require the attacker to capture all shares of some given outcome, and then force the market to finalize to that outcome.
[^19]: This includes external markets that pay reporting fees to Augur.
[^20]: This is true of all public oracles, even centralized ones.
[^21]: One attorep is $10^{-18}$ REP.
[^22]: There may be cases where some non-malicious reporters do migrate REP to a False universe accidentally or carelessly. However, such behavior is, in practice, indistinguishable from collaborating with an attacker.
[^23]: Doing so unnecessarily increases the cost of attack.
[^24]: In the future, Augur may be able to learn the price of REP without having to trust third parties. This is an active area of research.
[^25]: Measured in REP that exists in a universe that corresponds to the market’s final outcome; see Theorem 2 in Appendix A.
