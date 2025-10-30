'use client'

import type React from 'react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '../lib/utils'
import { useForkData } from '../providers/ForkDataProvider'
import { ForkLegend } from './ForkLegend'

export const ForkDetailsCard = (): React.JSX.Element => {
	const { gaugeData, riskLevel, lastUpdated, rawData, isLoading, error } =
		useForkData()
	const [isOpen, setIsOpen] = useState(false)
	const [isMobile, setIsMobile] = useState(false)
	const cardRef = useRef<HTMLDivElement>(null)
	const triggerRef = useRef<HTMLDivElement>(null)

	// Detect mobile and set interaction mode
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768)
		}

		checkMobile()
		window.addEventListener('resize', checkMobile)
		return () => window.removeEventListener('resize', checkMobile)
	}, [])

	// Close on click outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				cardRef.current &&
				!cardRef.current.contains(event.target as Node) &&
				triggerRef.current &&
				!triggerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false)
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside)
			return () =>
				document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isOpen])

	// Get risk description based on risk level
	const getRiskDescription = (): string => {
		switch (riskLevel.level) {
			case 'Normal':
				return 'No fork risk detected. Markets are operating normally.'
			case 'Low':
				return 'Minimal fork risk. Markets have small disputes but risk is low.'
			case 'Moderate':
				return 'Moderate fork risk. Significant disputes are active. Monitor closely.'
			case 'High':
				return 'High fork risk. Large dispute bonds pose a serious threat of forking.'
			case 'Elevated':
				return 'Critical fork risk. A fork is likely imminent. Take immediate action.'
			default:
				return 'Fork risk status unknown.'
		}
	}

	// Format large numbers with commas
	const formatNumber = (num: number): string => {
		return Math.round(num).toLocaleString()
	}

	// Format timestamp
	const formatTime = (isoString: string): string => {
		try {
			const date = new Date(isoString)
			return date.toLocaleString([], {
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			})
		} catch {
			return 'Unknown'
		}
	}

	const getRiskColor = (): string => {
		const percentage = gaugeData.percentage
		if (percentage < 10) return 'var(--color-green-400)'
		if (percentage < 25) return 'var(--color-yellow-400)'
		if (percentage < 75) return 'var(--color-orange-400)'
		return 'var(--color-red-500)'
	}

	const handleTriggerClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		setIsOpen(!isOpen)
	}

	const handleTriggerHover = (open: boolean) => {
		if (!isMobile) {
			setIsOpen(open)
		}
	}

	if (isLoading || error) {
		return <div />
	}

	const riskColor = getRiskColor()

	return (
		<div className="relative">
			{/* Trigger - the gauge area */}
			<div
				ref={triggerRef}
				onMouseEnter={() => handleTriggerHover(true)}
				onMouseLeave={() => handleTriggerHover(false)}
				onClick={handleTriggerClick}
				className="cursor-pointer"
				role="button"
				tabIndex={0}
				aria-label="View fork meter details"
				aria-pressed={isOpen}
			/>

			{/* Details Card */}
			{isOpen && (
				<div
					ref={cardRef}
					className={cn(
						'absolute top-full mt-3 left-1/2 -translate-x-1/2',
						'z-50 w-80 max-w-[calc(100vw-2rem)]',
						'bg-background/95 border border-primary/30',
						'rounded px-4 py-3 backdrop-blur-sm',
						'md:left-auto md:right-0 md:-translate-x-0',
					)}
				>
					{/* Header with Risk Badge */}
					<div className="mb-4 pb-3 border-b border-primary/20">
						<div className="flex items-center justify-between mb-2">
							<span className="text-xs font-light uppercase tracking-widest text-muted-foreground">
								Fork Risk Status
							</span>
							<div
								className="px-2 py-1 rounded text-xs font-light uppercase tracking-widest"
								style={{
									backgroundColor: `${riskColor}20`,
									color: riskColor,
									border: `1px solid ${riskColor}40`,
								}}
							>
								{riskLevel.level}
							</div>
						</div>

						{/* Percentage Display */}
						<div className="flex items-baseline gap-2">
							<span
								className="text-2xl font-light"
								style={{ color: riskColor }}
							>
								{formatNumber(gaugeData.percentage)}
							</span>
							<span className="text-sm text-muted-foreground">
								% of fork threshold
							</span>
						</div>
					</div>

					{/* What Does This Mean */}
					<div className="mb-4 pb-3 border-b border-primary/20">
						<p className="text-xs font-light leading-relaxed text-foreground">
							{getRiskDescription()}
						</p>
					</div>

					{/* Legend */}
					<div className="mb-4 pb-3 border-b border-primary/20">
						<ForkLegend />
					</div>

					{/* Current Metrics */}
					<div className="mb-4 pb-3 border-b border-primary/20">
						<p className="text-xs font-light uppercase tracking-widest text-muted-foreground mb-3">
							Current Metrics
						</p>
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									Largest Bond
								</span>
								<span className="text-foreground">
									{formatNumber(
										rawData.metrics.largestDisputeBond,
									)}{' '}
									REP
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									Active Disputes
								</span>
								<span className="text-foreground">
									{rawData.metrics.activeDisputes}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									Fork Threshold
								</span>
								<span className="text-foreground">
									{formatNumber(
										rawData.calculation.forkThreshold,
									)}{' '}
									REP
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									Last Updated
								</span>
								<span className="text-foreground text-xs">
									{formatTime(rawData.timestamp)}
								</span>
							</div>
						</div>
					</div>

					{/* CTA Links */}
					<div className="space-y-2">
						<a
							href="/learn/fork"
							className={cn(
								'block text-xs font-light uppercase tracking-widest text-center',
								'px-3 py-2 rounded border',
								'border-primary/40 text-primary hover:border-primary/60 hover:bg-primary/5',
								'transition-colors duration-200',
							)}
						>
							Learn About Forks
						</a>
						<a
							href="https://docs.google.com/viewer?url=https://github.com/AugurProject/whitepaper/releases/download/v2.0.6/augur-whitepaper-v2.pdf"
							target="_blank"
							rel="noopener noreferrer"
							className={cn(
								'block text-xs font-light uppercase tracking-widest text-center',
								'px-3 py-2 rounded border',
								'border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60 hover:bg-muted-foreground/5',
								'transition-colors duration-200',
							)}
						>
							Read Whitepaper
						</a>
					</div>
				</div>
			)}
		</div>
	)
}
