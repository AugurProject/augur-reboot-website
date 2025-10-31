'use client'

import type React from 'react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '../lib/utils'
import { useForkData } from '../providers/ForkDataProvider'
import Button from './Button'

interface ForkDetailsCardProps {
	gauge: React.ReactNode
}

export const ForkDetailsCard = ({ gauge }: ForkDetailsCardProps): React.JSX.Element => {
	const { gaugeData, riskLevel, rawData, isLoading, error } =
		useForkData()
	const [isOpen, setIsOpen] = useState(false)
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

	const asciiArt = `
--------------------------------------------------------------------------------
--------------------------------------------------------------------------------
--------------------------------------------------------------------------------
--------------------------------------------------------------------------------
----------------------------------------------------------+++++-----------------
-------------------------------------------------------+++++-++++---------------
-----------------------------------------------------+#+++-++####---------------
---------------------------------------------------+#+++++#######---------------
----------------------------------+++++++++------++++++########++---------------
-------------------------------+++++++++++++++++++++########++------------------
-----------------------------++++++######++++++++++#####++----------------------
--------------------------+++++++###########++++++++----------------------------
-----------------------++++++#######----+#####+++++++--+++++--------------------
-------------------+++++++#######----------+###+++++++++++++++------------------
----------------+++++++#######+-------------+++++++##++++++++-------------------
---------------+##+++#####++------------++++++++#####+++++----------------------
---------------+#######++----++++++++++++++++#####++++--------------------------
-----------------+##++-----+++++++++++++++#####++++-----------------------------
------------------------+++++++++++++++######+++++------------------------------
---------------------++++++++-##++++#####++++++++++-----------------------------
------------------++++++++----+#######++-++++++++++-----------------------------
---------------+++++++++-------+###+----+++++++++++-----------------------------
---------------+++++++-----------------+++++++++++------------------------------
-------------------------------------++++++++++---------------------------------
---------------------------------+++++++++++------------------------------------
------------------------------+++++++++++---------------------------------------
----------------------------+++++++++++-----------------------------------------
----------------------------++++++++--------------------------------------------
--------------------------------------------------------------------------------
--------------------------------------------------------------------------------
--------------------------------------------------------------------------------
--------------------------------------------------------------------------------
`

	return (
		<>
			{/* Gauge Container with Info Icon */}
			<div
				ref={gaugeContainerRef}
				className="relative inline-block cursor-pointer group"
				onClick={handleInfoClick}
			>
				{/* Gauge */}
				<div className="mb-2">
					{gauge}
				</div>

				{/* Info Icon - Top Right */}
				<button
					onClick={handleInfoClick}
					className={cn(
						'absolute -top-2 -right-2 p-2 rounded-full',
						'group-hover:fx-glow group-focus-within:fx-glow focus:outline-hidden',
						'transition-all duration-200 focus-visible:ouline-hidden',
						'text-muted-foreground group-focus-within:text-loud-foreground group-hover:text-loud-foreground group-focus:text-loud-foreground'
					)}
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
						className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
						onClick={() => setIsOpen(false)}
					/>

					{/* Modal */}
					<div
						ref={modalRef}
						className={cn(
							'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
							'z-50 w-[calc(100vw-2rem)] max-w-md max-h-[calc(100vh-4rem)]',
							'bg-background border border-foreground/30',
							'px-6 pt-4 pb-6 backdrop-blur-sm',
							'overflow-y-auto',
							'animate-in fade-in-50 zoom-in-95 duration-200',
						)}
					>
						{/* Header with Accent and Close Button */}
						<div className="mb-4">
							<div className="flex items-center justify-between mb-2">
								<div className="grid grid-cols-[auto_auto_auto] gap-x-2">
									<div className="h-2 w-12 bg-muted-foreground/50" />
									<div className="h-2 w-8 bg-muted-foreground/50" />
									<div className="h-2 w-4 bg-muted-foreground/50" />
								</div>
								{/* Close Button */}
								<button
									onClick={() => setIsOpen(false)}
									className={cn(
										'p-1 rounded-full cursor-pointer',
										'text-muted-foreground hover:text-primary text-sm',
										'transition-colors',
										'focus:outline-none focus:text-foreground focus:fx-glow',
									)}
									aria-label="Close"
									title="Close (Esc)"
								>
									[ x ] CLOSE
								</button>
							</div>
						</div>

						{/* Current Metrics */}
						<div className="pb-3 border-b border-foreground/30">
							<div className="text-sm">
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

						{/* Ascii Art + Description */}
						<div className="grid items-center sm:grid-cols-2 gap-4 py-4">
							<div>
								<pre className='text-[size:clamp(0.2rem,_100%,_0.25rem)] tracking-[-0.025em]'>
									{asciiArt}
								</pre>
							</div>
							<div className="text-left uppercase">
								<div className="pb-2 mb-2 border-b text-loud-foreground border-muted-foreground border-dashed font-bold">What's a fork?</div>
								<p className="text-sm font-normal leading-tight">Forking is the last market resolution method. It is a very disruptive process and is intended to be a rare occurrence.</p>
							</div>
						</div>

						{/* CTA Links */}
						<div className="space-y-2">
							<CTAButton href="/learn/fork">
								Learn More About Forking
							</CTAButton>
							<CTAButton
								href="https://docs.google.com/viewer?url=https://github.com/AugurProject/whitepaper/releases/download/v2.0.6/augur-whitepaper-v2.pdf"
								target="_blank"
								rel="noopener noreferrer"
							>
								<DocumentIcon /> Read The Whitepaper
							</CTAButton>
						</div>
					</div>
				</>
			)}
		</>
	)
}

type CTAButtonProps = {
	href: string
	children: React.ReactNode
	target?: '_blank'
	rel?: string
}

const CTAButton = ({ href, children }: CTAButtonProps) => <Button 
	variant="outline"
	href={href}
	className={cn(
		'w-full',
		'font-normal uppercase text-foreground hover:text-loud-foreground focus:text-loud-foreground',
		'hover:bg-foreground/5 focus:bg-foreground/5',
		'border-foreground/30 hover:border-foreground/60 focus:border-foreground/60'
	)}
>{ children }
</Button>

const DocumentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
