import type React from "react";
import { useForkData } from "./data-provider";

export const ForkStats = (): React.JSX.Element => {
	const { rawData, riskLevel } = useForkData();

	const isStable = rawData.metrics.largestDisputeBond === 0;
	const largestDispute =
		rawData.metrics.disputeDetails?.length > 0
			? rawData.metrics.disputeDetails.reduce((largest, current) =>
					current.disputeBondSize > largest.disputeBondSize ? current : largest,
				)
			: null;

	const riskLabel =
		riskLevel.level === "No Risk"
			? "NONE"
			: riskLevel.level === "Unknown"
				? "PROJECTION UNAVAILABLE"
				: riskLevel.level.toUpperCase();
	const roundDisplay =
		rawData.metrics.roundProgress === null
			? `${rawData.metrics.currentRound}/?`
			: rawData.metrics.estimatedTotalRounds
				? `${rawData.metrics.currentRound}/~${rawData.metrics.estimatedTotalRounds}`
				: `${rawData.metrics.currentRound}`;

	return (
		<div className="w-full mb-1">
			{isStable ? (
				<div className="text-lg font-display uppercase font-light text-green-400 tracking-widest fx-glow">
					System steady - No market disputes
				</div>
			) : (
				<div className="grid md:grid-cols-[10rem_12rem_10rem] md:place-content-center md:gap-y-4">
					{/* Panel 1 - Estimated Time to Fork */}
					<div className="text-center">
						<div className="text-sm uppercase font-display tracking-widest font-light text-muted-foreground">
							EST. TIME TO FORK
						</div>
						<div className="uppercase text-primary fx-glow-sm">
							{largestDispute && largestDispute.weeksRemaining > 0
								? `~${largestDispute.weeksRemaining}W`
								: riskLabel}
						</div>
					</div>

					{/* Panel 2 - Dispute Bond */}
					<div className="text-center md:border-x md:border-muted-foreground/40">
						<div className="text-sm uppercase font-display tracking-widest font-light text-muted-foreground">
							DISPUTE BOND
						</div>
						<div
							className="uppercase text-primary fx-glow-sm"
							title={`${rawData.metrics.largestDisputeBond.toLocaleString(undefined, { maximumFractionDigits: 3 })} REP`}
						>
							~{Math.round(rawData.metrics.largestDisputeBond).toLocaleString()}{" "}
							REP
						</div>
					</div>

					{/* Panel 3 - Dispute Round */}
					<div className="text-center">
						<div className="text-sm uppercase font-display tracking-widest font-light text-muted-foreground">
							DISPUTE ROUND
						</div>
						<div className="uppercase text-primary fx-glow-sm">
							{roundDisplay}
						</div>
					</div>

					{/* Market Title + Address */}
					{largestDispute && (
						<div className="text-center md:col-span-full">
							<div className="text-sm uppercase font-display tracking-widest font-light text-muted-foreground">
								MARKET IN DISPUTE
							</div>
							<div className="uppercase text-primary fx-glow-sm text-sm">
								{largestDispute.title}
							</div>
							<div className="text-xs text-muted-foreground/50 font-mono mt-0.5">
								{largestDispute.marketId}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
};
