import type React from 'react'
import { useForkData } from '../providers/ForkDataProvider'

export const ForkStats = (): React.JSX.Element => {
	const { rawData } = useForkData()

	// Check if there are no active disputes (stable state)
	const isStable = rawData.metrics.largestDisputeBond === 0

	// Get the largest dispute details if available
	const largestDispute = rawData.metrics.disputeDetails?.length > 0
		? rawData.metrics.disputeDetails.reduce((largest, current) =>
				current.disputeBondSize > largest.disputeBondSize ? current : largest
			)
		: null

	return (
		<div className="w-full mb-1">
			{isStable ? (
				<div className="text-lg font-display uppercase font-light text-green-400 tracking-widest fx-glow">
					System steady - No market disputes
				</div>
			) : (
				<div className="grid md:grid-cols-[10rem_12rem_10rem] md:place-content-center md:gap-y-4">
					{/* Panel 1 - Fork Risk */}
					<div className="text-center">
						<div className="text-sm uppercase font-display tracking-widest font-light text-muted-foreground">
							FORK RISK
						</div>
						<div className="uppercase text-primary fx-glow-sm">
							{rawData.metrics.forkThresholdPercent.toFixed(1)}%
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
							~{Math.round(rawData.metrics.largestDisputeBond).toLocaleString()} REP
						</div>
					</div>

					{/* Panel 3 - Dispute Round */}
					<div className="text-center">
  					<div className="text-sm uppercase font-display tracking-widest font-light text-muted-foreground">
							DISPUTE ROUND
						</div>
						<div className="uppercase text-primary fx-glow-sm">
							{largestDispute?.disputeRound || 1}
						</div>
					</div>

					{/* Market Address - properly constrained for truncation */}
					{largestDispute && (
						<div className="text-center md:col-span-full">
  						<div className="text-sm uppercase font-display tracking-widest font-light text-muted-foreground">
								MARKET IN DISPUTE
							</div>
							<div className="uppercase text-primary fx-glow-sm">
								{largestDispute.marketId}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	)
}
