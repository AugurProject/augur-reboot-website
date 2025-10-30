'use client'

import type React from 'react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '../lib/utils'
import { useForkData } from '../providers/ForkDataProvider'
import { ForkLegend } from './ForkLegend'

interface ForkDetailsCardProps {
	gauge: React.ReactNode
}

export const ForkDetailsCard = ({ gauge }: ForkDetailsCardProps): React.JSX.Element => {
	const { gaugeData, riskLevel, lastUpdated, rawData, isLoading, error } =
		useForkData()
	const [isOpen, setIsOpen] = useState(false)
	const [isHovering, setIsHovering] = useState(false)
	const gaugeContainerRef = useRef<HTMLDivElement>(null)
	const modalRef = useRef<HTMLDivElement>(null)

	// Close on click outside modal
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				modalRef.current &&
				!modalRef.current.contains(event.target as Node)
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

	// Handle escape key to close modal
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setIsOpen(false)
			}
		}

		if (isOpen) {
			document.addEventListener('keydown', handleEscape)
			return () =>
				document.removeEventListener('keydown', handleEscape)
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

	const handleInfoClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		setIsOpen(true)
	}

	if (isLoading || error) {
		return <div />
	}

	const riskColor = getRiskColor()

	return (
		<>
			{/* Gauge Container with Info Icon */}
			<div
				ref={gaugeContainerRef}
				className="relative inline-block"
				onMouseEnter={() => setIsHovering(true)}
				onMouseLeave={() => setIsHovering(false)}
			>
				{/* Gauge */}
				<div className="mb-2">
					{gauge}
				</div>

				{/* Info Icon - Top Right */}
				<button
					onClick={handleInfoClick}
					className={cn(
						'absolute top-0 right-0 p-2 rounded-full',
						'transition-all duration-200',
						isHovering
							? 'bg-primary/20 border border-primary/60'
							: 'bg-primary/10 border border-primary/30',
						'hover:bg-primary/30 hover:border-primary/80',
						'focus:outline-none focus:ring-2 focus:ring-primary/50',
					)}
					style={{
						filter: isHovering
							? `drop-shadow(0 0 0.625rem var(--color-primary))`
							: 'none',
						transition: 'filter 0.2s',
					}}
					aria-label="View fork meter details"
					title="Click for more information"
				>
					{/* Info Icon SVG */}
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="text-primary"
					>
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="16" x2="12" y2="12" />
						<line x1="12" y1="8" x2="12.01" y2="8" />
					</svg>
				</button>
			</div>

			{/* Modal Popup */}
			{isOpen && (
				<>
					{/* Backdrop */}
					<div
						className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
						onClick={() => setIsOpen(false)}
					/>

					{/* Modal */}
					<div
						ref={modalRef}
						className={cn(
							'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
							'z-50 w-96 max-w-[calc(100vw-2rem)]',
							'bg-background border border-primary/30',
							'rounded px-6 py-6 backdrop-blur-sm',
							'animate-in fade-in-50 zoom-in-95 duration-200',
						)}
					>
					{/* Header with Risk Badge and Close Button */}
					<div className="mb-4 pb-3 border-b border-primary/20">
						<div className="flex items-center justify-between mb-2">
							<span className="text-xs font-light uppercase tracking-widest text-muted-foreground">
								Fork Risk Status
							</span>
							<div className="flex items-center gap-3">
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
								{/* Close Button */}
								<button
									onClick={() => setIsOpen(false)}
									className={cn(
										'p-1 rounded-full',
										'text-muted-foreground hover:text-primary',
										'hover:bg-primary/10 transition-colors',
										'focus:outline-none focus:ring-2 focus:ring-primary/50',
									)}
									aria-label="Close"
									title="Close (Esc)"
								>
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<line x1="18" y1="6" x2="6" y2="18" />
										<line x1="6" y1="6" x2="18" y2="18" />
									</svg>
								</button>
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
				</>
			)}
		</>
	)
}
