import type React from 'react'

interface ForkBadgeProps {
	level: 'Low' | 'Medium' | 'High' | 'Critical'
}

export const ForkBadge = ({ level }: ForkBadgeProps): React.JSX.Element => {
	const getTextColor = (level: string) => {
		switch (level) {
			case 'Low':
				return 'text-green-400 fx-glow'
			case 'Medium':
				return 'text-yellow-400 fx-glow'
			case 'High':
				return 'text-orange-400 fx-glow'
			case 'Critical':
				return 'text-red-400 fx-pulse-glow animate-pulse'
			default:
				return 'text-foreground'
		}
	}

	return <span className={getTextColor(level)}>{level}</span>
}