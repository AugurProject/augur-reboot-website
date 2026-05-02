import React, { useMemo } from 'react'
import { cn } from '../lib/utils'
import type { GaugeDisplayProps } from '../types/gauge'

/**
 * Calculate arc path endpoint for a given fill percentage (0-100).
 * Maps percentage to angle from 180° to 0° (π to 0 radians).
 */
const updateArc = (percentage: number): string => {
	const angle = Math.PI - (percentage / 100) * Math.PI
	const centerX = 200
	const centerY = 200
	const radius = 120

	const endX = centerX + radius * Math.cos(angle)
	const endY = centerY - radius * Math.sin(angle)

	return `M 80 200 A 120 120 0 0 1 ${endX} ${endY}`
}

const getRiskLevel = (percentage: number): string => {
	if (percentage === 0) return 'NO RISK'
	if (percentage < 25) return 'LOW'
	if (percentage < 50) return 'MEDIUM'
	if (percentage < 75) return 'HIGH'
	return 'EXTREME'
}

const getRiskColor = (percentage: number): string => {
	if (percentage < 25) return 'var(--color-green-400)'
	if (percentage < 50) return 'var(--color-yellow-400)'
	if (percentage < 75) return 'var(--color-orange-400)'
	return 'var(--color-red-500)'
}

const getNeedleEndpoint = (percentage: number): { x: number; y: number } => {
	const angle = Math.PI - (percentage / 100) * Math.PI
	const centerX = 200
	const centerY = 200
	const radius = 100

	return {
		x: centerX + radius * Math.cos(angle),
		y: centerY - radius * Math.sin(angle),
	}
}

const ForkGaugeComponent = ({
	percentage,
}: GaugeDisplayProps): React.JSX.Element => {
	const arcPath = useMemo(() => updateArc(percentage), [percentage])
	const riskColor = useMemo(() => getRiskColor(percentage), [percentage])
	const riskLevel = useMemo(() => getRiskLevel(percentage), [percentage])
	const needleEndpoint = useMemo(() => getNeedleEndpoint(percentage), [percentage])

	const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
	const needleTransition = prefersReducedMotion ? 'none' : 'all 0.3s ease-in-out'

	return (
		<div className={cn('relative flex flex-col items-center')}>
			<svg className="max-w-45 w-full" viewBox="60 60 280 160" role="img" aria-label="Fork risk gauge">
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
					d={arcPath}
					fill="none"
					stroke="url(#forkMeterGradient)"
					strokeWidth="12"
					strokeLinecap="round"
					className="fx-glow"
				/>

				{/* Needle pointer group */}
				<g
					style={{
						transition: needleTransition,
					}}
				>
					{/* Needle shadow for depth */}
					<line
						x1="200"
						y1="200"
						x2={needleEndpoint.x + 2}
						y2={needleEndpoint.y + 2}
						stroke="rgba(0, 0, 0, 0.3)"
						strokeWidth="4"
						strokeLinecap="round"
					/>
					{/* Main needle */}
					<line
						x1="200"
						y1="200"
						x2={needleEndpoint.x}
						y2={needleEndpoint.y}
						stroke={riskColor}
						strokeWidth="4"
						strokeLinecap="round"
						style={{
							filter: `drop-shadow(0 0 6px ${riskColor})`,
						}}
					/>
				</g>

				{/* Center hub */}
				<circle
					cx="200"
					cy="200"
					r="8"
					fill={riskColor}
					style={{
						filter: `drop-shadow(0 0 6px ${riskColor})`,
					}}
				/>

				{/* Risk level text at baseline of arc */}
				<text
					x="200"
					y="165"
					textAnchor="middle"
					fill={riskColor}
					fontWeight="bold"
					className={cn('text-4xl font-display fx-glow-sm', `fx-glow-[${riskColor}]`)}
				>
					{riskLevel}
				</text>
			</svg>

			<div className="font-display text-lg uppercase tracking-[0.75rem] -mr-2 font-light text-muted-foreground">
				FORK RISK
			</div>
		</div>
	)
}

export const ForkGauge = React.memo(ForkGaugeComponent)
