# Appendix B: Bond Size Adjustments

The validity bond and the creation bond are dynamically adjusted based on the behavior of participants during the previous dispute window. The creation bond is the maximum of the no-show bond and the designated reporter bond – two values that the system tracks in order to compute the creation bond but does not expose to users.

Here we describe how we adjust these bonds.

We define the function $f : [0,1] \to [\frac{1}{2},2]$ by:[^29]

$$
f(x)=
\begin{cases}
\frac{100}{99}x+\frac{98}{99} & \text{for } x > \frac{1}{100} \\
50x+\frac{1}{2} & \text{for } x \le \frac{1}{100}
\end{cases}
\tag{B1}
$$

The function $f$ is used to determine the multiple used in these adjustments, as described in the subsections below. In brief, if the undesirable behavior occurred exactly 1% of the time during the previous dispute window, then the bond size remains the same. If it was less frequent, then the bond size will be reduced by as much as half. If it was more frequent, then the bond size will be increased by as much as a factor of 2.

## 1. Validity Bond

During the very first dispute window after launch, the validity bond will be set at 0.01 ETH. Then, if more than 1% of the finalized markets in the previous dispute window were invalid, the validity bond will be increased. If less than 1% of the finalized markets in the previous dispute window were invalid, then the validity bond will be decreased (but will never be lower than 0.01 ETH). In particular, we let $\nu$ be the proportion of finalized markets in the previous dispute window that were invalid, and $b_v$ be the amount of the validity bond from the previous dispute window. Then the validity bond for the current window is

$$
\max\left\{\frac{1}{100}, b_v f(\nu)\right\}.
$$

## 2. No-Show Bond

During the very first dispute window after launch, the no-show bond will be set at 0.35 REP. As with the validity bond, the no-show bond is adjusted up or down, targeting a 1% no-show rate with a floor of 0.35 REP. Specifically, we let $\rho$ be the proportion of markets in the previous dispute window whose designated reporters failed to report on time, and we let $b_r$ be the amount of the no-show bond from the previous dispute window. The amount of the no-show bond for the current dispute window is

$$
\max\{0.35,b_r f(\rho)\}.
$$

## 3. Designated Reporter Bond

During the very first dispute window after launch, the amount of the designated reporter bond will be set at 0.35 REP. The amount of the designated reporter bond is dynamically adjusted according to how many designated reports were incorrect (failed to concur with the final market outcome) during the previous dispute window. In particular, we let $\delta$ be the proportion of designated reports that were incorrect during the previous dispute window, and we let $b_d$ be the amount of the designated reporter stake during the previous dispute window. Then the amount of the designated reporter bond for the current window is

$$
\max\{0.35,b_d f(\delta)\}.
$$

[^29]: This formula may change once empirical data from live markets is obtained.
