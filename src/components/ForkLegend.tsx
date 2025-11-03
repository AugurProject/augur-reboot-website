import type React from 'react'
import { cn } from '../lib/utils'

interface RiskLevelLegendEntry {
	level: string
	color: string
	range: string
	description: string
}

const RISK_LEVELS: RiskLevelLegendEntry[] = [
	{
		level: 'Normal',
		color: 'var(--color-green-400)',
		range: '0%',
		description: 'No fork risk detected',
	},
	{
		level: 'Low',
		color: 'var(--color-green-400)',
		range: '0-10%',
		description: 'Minimal fork risk',
	},
	{
		level: 'Moderate',
		color: 'var(--color-yellow-400)',
		range: '10-25%',
		description: 'Moderate fork risk',
	},
	{
		level: 'High',
		color: 'var(--color-orange-400)',
		range: '25-75%',
		description: 'High fork risk',
	},
	{
		level: 'Elevated',
		color: 'var(--color-red-500)',
		range: '75-100%',
		description: 'Critical fork risk',
	},
]

export const ForkLegend = (): React.JSX.Element => {
	return (
		<div className={cn('space-y-2')}>
			<p className="text-xs font-light uppercase tracking-widest text-muted-foreground mb-3">
				Risk Levels
			</p>
			<div className="space-y-1">
				{RISK_LEVELS.map((level) => (
					<div
						key={level.level}
						className="flex items-center gap-2 text-xs"
					>
						{/* Color indicator */}
						<div
							className="h-3 w-3 rounded-sm"
							style={{
								backgroundColor: level.color,
								boxShadow: `0 0 0.25rem ${level.color}`,
							}}
						/>
						{/* Level and range */}
						<span className="font-light text-foreground min-w-20">
							{level.level}
						</span>
						<span className="text-muted-foreground">
							{level.range}
						</span>
					</div>
				))}
			</div>
		</div>
	)
}
