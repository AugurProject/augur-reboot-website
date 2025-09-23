import type React from 'react'
import { cn } from '../lib/utils'
import { useForkData } from '../providers/ForkDataProvider'
import type { DataPanelsProps } from '../types/gauge'

export const ForkStats = ({
	riskLevel,
	repStaked,
	activeDisputes,
}: DataPanelsProps): React.JSX.Element => {
	const { rawData } = useForkData()
	
	const formatNumber = (num: number): string => {
		return num.toLocaleString()
	}

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
				<div className="uppercase font-light text-green-400 tracking-[0.1em] fx-glow">
					System steady - No market disputes
				</div>
			) : (
				<div className="grid md:grid-cols-[8rem_8rem_8rem] md:place-content-center md:gap-y-2">
					{/* Panel 1 - Fork Risk */}
					<div className="text-center">
						<div className="text-xs uppercase tracking-[0.1em] font-light text-muted-foreground">
							FORK RISK
						</div>
						<div className="uppercase font-light text-primary tracking-[0.1em] fx-glow">
							{rawData.metrics.forkThresholdPercent.toFixed(1)}%
						</div>
					</div>
					
					{/* Panel 2 - Dispute Bond */}
					<div className="text-center md:border-x md:border-muted-foreground/40">
						<div className="text-xs uppercase tracking-[0.1em] font-light text-muted-foreground">
							DISPUTE BOND
						</div>
						<div className="uppercase font-light text-primary tracking-[0.1em] fx-glow">
							{formatNumber(rawData.metrics.largestDisputeBond)} REP
						</div>
					</div>
					
					{/* Panel 3 - Dispute Round */}
					<div className="text-center">
						<div className="text-xs uppercase tracking-[0.1em] font-light text-muted-foreground">
							DISPUTE ROUND
						</div>
						<div className="uppercase font-light text-primary tracking-[0.1em] fx-glow">
							{largestDispute?.disputeRound || 1}
						</div>
					</div>

					{/* Market Address - properly constrained for truncation */}
					{largestDispute && (
						<div className="text-center md:col-span-full">
							<div className="text-xs uppercase tracking-[0.1em] font-light text-muted-foreground">
								MARKET IN DISPUTE
							</div>
							<div className="uppercase font-light text-primary tracking-[0.1em] truncate mx-auto fx-glow" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
								{largestDispute.marketId}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	)
}
