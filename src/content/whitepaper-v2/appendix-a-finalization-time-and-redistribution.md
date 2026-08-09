# Appendix A: Finalization Time & Redistribution

We begin with some notation, definitions, and observations.

**Definition 5.** For a given market $M$, let $\Omega_M$ be the outcome space (or set of outcomes) of $M$.

**Definition 6.** For $n \ge 1$ and $\omega \in \Omega_M$, let $S(\omega,n)$ denote the total amount of stake on outcome $\omega$ at the beginning of dispute round $n$. This includes all stake from all successful dispute bonds in favor of $\omega$ over all previous dispute rounds.

**Definition 7.** For $n \ge 1$ and $\omega \in \Omega_M$, let $S(\bar{\omega},n)$ denote the amount of stake on all outcomes in $\Omega_M$ except for $\omega$ at the beginning of dispute round $n$:

$$
S(\bar{\omega},n) = \sum_{\substack{\gamma \in \Omega_M \\ \gamma \ne \omega}} S(\gamma,n).
$$

**Definition 8.** For $n \ge 1$, let $A_n$ denote the total stake over all outcomes $M$ at the beginning of dispute round $n$:

$$
A_n = \sum_{\omega \in \Omega_M} S(\omega,n).
$$

**Observation 3.** It follows that

$$
A_n - S(\omega,n) = S(\bar{\omega},n).
$$

**Definition 9.** For $n \ge 1$, let $\hat{\omega}_n$ denote the tentative outcome at the beginning of dispute round $n$. For example, $\hat{\omega}_1$ is the outcome reported by the initial reporter.

**Definition 10.** For $n \ge 1$ and $\omega \ne \hat{\omega}_n$, let $B(\omega,n)$ denote the amount of stake required to successfully fill a dispute bond in favor of outcome $\omega$ during dispute round $n$. Recall that the amount of stake required to successfully fill a dispute bond in favor of outcome $\omega$ during dispute round $n$, where $\omega \ne \hat{\omega}_n$, is given by Eq. 1:

$$
B(\omega,n) = 2A_n - 3S(\omega,n).
$$

**Observation 4.** If a dispute bond is successfully filled in favor of outcome $\omega$ during dispute round $n$, then

$$
S(\omega,n+1) = B(\omega,n) + S(\omega,n).
$$

That is, the successful dispute stake is the only new stake applied to outcome $\omega$ at the end of dispute round $n$.

**Observation 5.** For all $\omega \ne \hat{\omega}_n$,

$$
S(\omega,n-1) = S(\omega,n).
$$

That is, if a dispute bond is not entirely filled in favor of outcome $\omega$, then no additional stake is added to outcome $\omega$ at the beginning of the next dispute round. This is due to the fact that all unsuccessful dispute stake is returned to the users at the end of the dispute round.

**Observation 6.** For all $n \ge 2$,

$$
A_n = A_{n-1} + B(\hat{\omega}_{n-1},n-1).
$$

That is, the total stake over all outcomes at the beginning of a dispute round is simply the total stake from the beginning of the previous dispute round plus the successful dispute stake from the previous dispute round. All other stake is returned to users at the end of the previous dispute round.

**Lemma 1.**

$$
S(\hat{\omega}_n,n) = 2S(\bar{\omega}_n,n), \qquad \text{for } n \ge 2.
$$

**Proof.** Suppose a market enters dispute round $n$, where $n \ge 2$. During dispute round $n-1$, the outcome $\hat{\omega}_{n-1}$ must have been successfully disputed in favor of outcome $\hat{\omega}_n$. According to Eq. 1, the size of that dispute bond is

$$
B(\hat{\omega}_n,n-1) = 2A_{n-1} - 3S(\hat{\omega}_n,n-1).
$$

Using Observation 3 this can be rewritten as

$$
B(\hat{\omega}_n,n-1) + S(\hat{\omega}_n,n-1) = 2S(\bar{\omega}_n,n-1) \tag{A1}
$$

We know the dispute bond was successfully filled during round $n-1$. Using Observation 4, we see that

$$
B(\hat{\omega}_n,n-1) + S(\hat{\omega}_n,n-1) = S(\hat{\omega}_n,n).
$$

Observation 5 tells us that the total amount staked on $\hat{\omega}_n$ is unchanged from round $n-1$ to $n$:

$$
2S(\bar{\omega}_n,n-1) = 2S(\bar{\omega}_n,n).
$$

Thus, Eq. A1 reduces to

$$
S(\hat{\omega}_n,n) = 2S(\bar{\omega}_n,n).
$$

**Theorem 2.** Any REP holders successfully disputing an outcome in favor of a market’s final outcome will receive a 40% ROI on their dispute stake (measured in REP that exists in a universe that corresponds to the market’s final outcome), unless the market is interrupted by some other market causing a fork.

**Proof.** During a fork, all users who successfully filled dispute bonds in favor of the forking market’s final outcome are given (via coins minted during the fork) a 40% return on their dispute stake when they migrate their dispute stake to the corresponding child universe. Thus, in the case where the market in question has caused a fork, the theorem is immediately true.

Now consider the case where the market in question resolves without causing a fork, and reporting is not interrupted by some other market causing a fork. Denote the market’s final outcome by $\omega_{\mathrm{Final}}$ and suppose the market resolves at the end of dispute round $n$, where $n \ge 2$. That means the tentative outcome for round $n$ is $\omega_{\mathrm{Final}}$, and that outcome is not successfully disputed during round $n$. In other words:

$$
\hat{\omega}_n = \omega_{\mathrm{Final}}.
$$

Then by Lemma 1 we know that

$$
S(\omega_{\mathrm{Final}},n) = 2S(\bar{\omega}_{\mathrm{Final}},n).
$$

Since the market resolves at the end of round $n$ with no further stake added to any outcome, the above equation shows the final amount of stake on the market’s final outcome, $\omega_{\mathrm{Final}}$, and the sum of all stake on the market’s other outcomes, $\bar{\omega}_{\mathrm{Final}}$. Note that there is exactly twice as much stake on the market’s final outcome as there is on all other outcomes combined. Augur burns 20% of the all stake on the non-final outcomes and redistributes the rest to users who staked on $\omega_{\mathrm{Final}}$, in proportion to the amount of REP they staked. Therefore the users who successfully filled a dispute bond in favor of $\omega_{\mathrm{Final}}$ get a 40% ROI on their staked REP.

Next, consider the maximum number of dispute rounds required to resolve a market. Eq. 1 is minimized when $\omega$ is chosen to be the non-tentative outcome that begins the dispute round with the greatest amount of stake. Lemma 1 implies that the non-tentative outcome with the greatest amount of stake is the previous dispute round’s tentative outcome. Therefore, the smallest possible dispute bond size that can be successfully filled during dispute round $n$, where $n \ge 2$, is $B(\hat{\omega}_{n-1},n)$. In other words, the dispute bond size grows slowest when the same two outcomes are repeatedly disputed in favor of one another. It follows that the number of dispute rounds required for a market to initiate a fork is maximized when the same two outcomes are repeatedly disputed in favor of one another. Therefore we can determine the maximum number of dispute rounds that any market may undergo before initiating a fork by finding the maximum number of dispute rounds that can occur in the particular case where the same two market outcomes are repeatedly disputed in favor of one another. We examine that case now. Suppose that every successful dispute bond is filled in favor of the previous dispute round’s tentative outcome. Then the two tentative outcomes that are iteratively disputed in favor of one another are $\hat{\omega}_1$ and $\hat{\omega}_2$.

**Observation 7.** In the case where the same two tentative outcomes are repeatedly disputed in favor of one another,

$$
\hat{\omega}_n = \hat{\omega}_{n-2} \qquad \text{for all } n \ge 3.
$$

**Definition 11.** Let $d$ denote the amount of stake placed on $\hat{\omega}_1$ during the initial report. Because the tentative outcome for each round is known in this situation, we can simplify our notation for the dispute bond sizes. Define a shorthand $B_n$ to denote the bond size required for round $n$, so that $B_1 = 2d$ and $B_n = B(\hat{\omega}_{n-1},n)$ for all $n \ge 2$. This will make for easier reading and comprehension.

**Observation 8.** In the case where the same two tentative outcomes are repeatedly disputed in favor of one another,

$$
S(\hat{\omega}_{n-1},n) = S(\hat{\omega}_{n-1},n-2) + B_{n-2}, \qquad n \ge 3.
$$

(That is, every other successful dispute bond is added to the same outcome.)

**Lemma 2.** If the same two tentative outcomes are repeatedly disputed in favor of one another, then for all $n$ where $n \ge 3$:

$$
\begin{aligned}
1.\quad S(\hat{\omega}_{n-1},n) &= \frac{2}{3}B_{n-1} \\
2.\quad A_n &= 2B_{n-1} \\
3.\quad B_n &= 3d2^{n-2}
\end{aligned}
$$

**Proof.** (By induction on $n$) Suppose the same two tentative outcomes are repeatedly disputed in favor of one another.

**Base Case.** By definition and Eq. 1 we make the following observations:

- $S(\hat{\omega}_1,1)=d$, $S(\hat{\omega}_2,1)=0$, $A_1=d$, and $B_1=2d$.
- $S(\hat{\omega}_1,2)=d$, $S(\hat{\omega}_2,2)=2d$, $A_2=3d$, and $B_2=3d$.
- $S(\hat{\omega}_1,3)=4d$, $S(\hat{\omega}_2,3)=2d$, $A_3=6d$, and $B_3=6d$.

$S(\hat{\omega}_{3-1},3)=S(\hat{\omega}_2,3)=2d=\frac{2}{3}(3d)=\frac{2}{3}B_2=\frac{2}{3}B_{3-1}$, so part 1 of the lemma holds for $n=3$. $A_3=6d=2(3d)=2B_2=2B_{3-1}$, so part 2 of the lemma holds for $n=3$. $B_3=6d=3d2^{3-2}$, so part 3 of the lemma holds for $n=3$. Therefore the lemma, in its entirety, holds true for the base case of $n=3$.

**Induction.** Suppose the lemma is true for all $n$ such that $3 \le n \le k$. We want to show that the lemma holds for $n=k+1$. That is, we want to show that:

$$
\begin{aligned}
\text{(a)}\quad S(\hat{\omega}_k,k+1) &= \frac{2}{3}B_k \\
\text{(b)}\quad A_{k+1} &= 2B_k \\
\text{(c)}\quad B_{k+1} &= 3d2^{k-1}
\end{aligned}
$$

First, we prove part (a). By Observation 8:

$$
S(\hat{\omega}_k,k+1) = S(\hat{\omega}_k,k-1) + B_{k-1}.
$$

By Observation 7 we can rewrite the above as:

$$
S(\hat{\omega}_{k-2},k+1) = S(\hat{\omega}_{k-2},k-1) + B_{k-1}.
$$

By the induction hypothesis, we can rewrite $S(\hat{\omega}_{k-2},k-1)$ as $\frac{2}{3}B_{k-2}$ on the right-hand side to get:

$$
S(\hat{\omega}_{k-2},k+1) = \frac{2}{3}B_{k-2} + B_{k-1}.
$$

By the induction hypothesis, we can write $B_{k-2}$ as $3d2^{k-4}$ and $B_{k-1}$ as $3d2^{k-3}$:

$$
S(\hat{\omega}_{k-2},k+1) = d2^{k-1}.
$$

Applying Observation 7 to the left-hand side we get:

$$
S(\hat{\omega}_k,k+1) = d2^{k-1}.
$$

Finally, note that by the above equation and the induction hypothesis,

$$
S(\hat{\omega}_k,k+1) = d2^{k-1} = \frac{2}{3}(3d2^{k-2}) = \frac{2}{3}B_k.
$$

This proves part (a).

Next, we prove part (b). By Observation 6:

$$
A_{k+1} = A_k + B_k.
$$

By the induction hypothesis, $A_k=2B_{k-1}$:

$$
A_{k+1} = 2B_{k-1} + B_k.
$$

By the induction hypothesis, $B_{k-1}=3d2^{k-3}$, so the right-hand side can be simplified to

$$
A_{k+1} = 3d2^{k-2} + B_k.
$$

By the induction hypothesis, $B_k=3d2^{k-2}$ to rewrite the right-hand side as

$$
A_{k+1} = 2B_k,
$$

and part (b) is proved.

Finally, we prove part (c). By Eq. 1:

$$
B_{k+1} = 2A_{k+1} - 3S(\hat{\omega}_k,k+1).
$$

By Observation 8, we can write $S(\hat{\omega}_k,k+1)$ as $S(\hat{\omega}_k,k-1)+B_{k-1}$:

$$
B_{k+1} = 2A_{k+1} - 3\left(S(\hat{\omega}_k,k-1)+B_{k-1}\right).
$$

By Observation 7, $\hat{\omega}_k=\hat{\omega}_{k-2}$:

$$
B_{k+1} = 2A_{k+1} - 3\left(S(\hat{\omega}_{k-2},k-1)+B_{k-1}\right).
$$

By Observation 6, $A_{k+1}=A_k+B_k$:

$$
B_{k+1} = 2(A_k+B_k) - 3\left(S(\hat{\omega}_{k-2},k-1)+B_{k-1}\right).
$$

By the induction hypothesis, $A_k=2B_{k-1}$ and $S(\hat{\omega}_{k-2},k-1)=\frac{2}{3}B_{k-2}$:

$$
B_{k+1} = 2\left(2B_{k-1}+B_k\right) - 3\left(\frac{2}{3}B_{k-2}+B_{k-1}\right).
$$

By the induction hypothesis, $B_k=3d2^{k-2}$, $B_{k-1}=3d2^{k-3}$, and $B_{k-2}=3d2^{k-4}$. Making these substitutions and simplifying yields:

$$
B_{k+1} = 3d2^{k-1}.
$$

This proves part (c), and concludes the proof of the lemma.

**Theorem 3.** If not interrupted by some other market causing a fork, a given market may undergo at most 20 dispute rounds before finalizing or causing a fork.

**Proof.** Suppose that a given market is not interrupted by some other market causing a fork. Then, as shown above, we know that the number of dispute rounds required for a market to initiate a fork is maximized when the same two outcomes are repeatedly disputed in favor of one another. Part 3 of Lemma 2 tells us that, in this situation, the dispute bond size required for successfully disputing the tentative outcome during round $n$ is given by $3d2^{n-2}$, where $d$ is the amount of the stake placed during the initial report. We know that forks are initiated after the successful fulfillment of a dispute bond with size at least 2.5% of all existing REP, and we know that there are 11 million REP in existence. Thus a fork is initiated when a dispute bond of size 275,000 REP is filled. We also know that $d \ge 0.35$ REP, because the minimum amount of stake on the initial report is 0.35 REP[^28]. Solving $3(0.35)2^{n-2} > 275,000$ for $n \in \mathbb{Z}$ yields $n \ge 20$. Thus, we can guarantee that a market will resolve or cause a fork after at most 20 dispute rounds.

[^28]: See appendixes B2 and B3.
