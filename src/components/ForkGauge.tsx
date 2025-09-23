import type React from 'react'
import { cn } from '../lib/utils'
import type { GaugeDisplayProps } from '../types/gauge'

export const ForkGauge = ({
	percentage,
}: GaugeDisplayProps): React.JSX.Element => {
	/**
	 * Convert fork threshold percentage to visual gauge percentage
	 * Maps the actual risk to intuitive visual representation
	 */
	const getVisualPercentage = (forkThresholdPercent: number): number => {
		// Minimum 3% visual fill for "system active" indication when stable
		const MIN_VISUAL_FILL = 3

		if (forkThresholdPercent === 0) {
			// Show minimal green fill when stable to indicate system is monitoring
			return MIN_VISUAL_FILL
		} else if (forkThresholdPercent <= 10) {
			// 0-10% fork threshold = 3-25% gauge (Low risk zone)
			// Start from MIN_VISUAL_FILL to avoid visual gap
			return MIN_VISUAL_FILL + ((forkThresholdPercent / 10) * (25 - MIN_VISUAL_FILL))
		} else if (forkThresholdPercent <= 25) {
			// 10-25% fork threshold = 25-50% gauge (Moderate risk zone)
			return 25 + ((forkThresholdPercent - 10) / 15) * 25
		} else if (forkThresholdPercent <= 75) {
			// 25-75% fork threshold = 50-90% gauge (High risk zone)
			return 50 + ((forkThresholdPercent - 25) / 50) * 40
		} else {
			// 75%+ fork threshold = 90-100% gauge (Critical risk zone)
			return Math.min(100, 90 + ((forkThresholdPercent - 75) / 25) * 10)
		}
	}

	const updateArc = (actualPercentage: number): string => {
		// Use visual percentage for arc display
		const visualPercentage = getVisualPercentage(actualPercentage)

		// Calculate the end point of the arc based on visual percentage
		// Map percentage to angle from 180° to 0° (π to 0 radians)
		const angle = Math.PI - (visualPercentage / 100) * Math.PI
		const centerX = 200
		const centerY = 200
		const radius = 120

		// Calculate end point
		const endX = centerX + radius * Math.cos(angle)
		const endY = centerY - radius * Math.sin(angle)

		// Always create arc path - minimum visual fill ensures we never have 0% visual
		return `M 80 200 A 120 120 0 0 1 ${endX} ${endY}`
	}

	const getRiskLevel = (forkThresholdPercent: number): string => {
		if (forkThresholdPercent === 0) return 'STABLE'
		if (forkThresholdPercent < 10) return 'LOW'
		if (forkThresholdPercent < 25) return 'MODERATE'
		if (forkThresholdPercent < 75) return 'HIGH'
		return 'CRITICAL'
	}

	const getRiskColor = (forkThresholdPercent: number): string => {
		// Use the site's existing color variables
		if (forkThresholdPercent < 10) return 'var(--color-green-400)'
		if (forkThresholdPercent < 25) return 'var(--color-yellow-400)'
		if (forkThresholdPercent < 75) return 'var(--color-orange-400)'
		return 'var(--color-red-500)'
	}

	return (
		<div className={cn('relative mb-2 flex flex-col items-center')}>
			<svg className="max-w-[180px] w-full" viewBox="60 60 280 160">
				<defs>
					<linearGradient
						id="forkMeterGradient"
						x1="80"
						y1="200"
						x2="320"
						y2="200"
						gradientUnits="userSpaceOnUse"
					>
						<stop
							offset="0%"
							style={{ stopColor: 'var(--color-green-400)' }}
						/>
						<stop
							offset="35%"
							style={{ stopColor: 'var(--color-green-500)' }}
						/>
						<stop
							offset="55%"
							style={{ stopColor: 'var(--color-yellow-400)' }}
						/>
						<stop
							offset="80%"
							style={{ stopColor: 'var(--color-orange-400)' }}
						/>
						<stop
							offset="100%"
							style={{ stopColor: 'var(--color-red-500)' }}
						/>
					</linearGradient>
				</defs>

				{/* Background track */}
				<path
					d="M 80 200 A 120 120 0 0 1 320 200"
					fill="none"
					stroke="var(--color-green-800)"
					strokeWidth="12"
					strokeLinecap="round"
					opacity="0.3"
				/>

				{/* Dynamic colored arc with glow effect */}
				<path
					d={updateArc(percentage)}
					fill="none"
					stroke="url(#forkMeterGradient)"
					strokeWidth="12"
					strokeLinecap="round"
					className="fx-glow"
				/>

				{/* Risk level text at baseline of arc */}
				<text
					x="200"
					y="195"
					textAnchor="middle"
					fill={getRiskColor(percentage)}
					fontSize="2.5rem"
					fontWeight="bold"
					className={cn('fx-glow-sm', `fx-glow-[${getRiskColor(percentage)}]`)}
				>
					{getRiskLevel(percentage)}
				</text>
			</svg>

			<div className="text-sm uppercase tracking-[0.5em] font-light text-muted-foreground">
				FORK PRESSURE
			</div>
		</div>
	)
}
