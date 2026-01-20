import { useState, type HTMLAttributes } from 'react'
import { cn } from '../lib/utils'
import { useForkData } from '../providers/ForkDataProvider'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { ForkAsciiArt } from './ForkAsciiArt'
import Button from './Button'

interface ForkDetailsCardProps {
	gauge: React.ReactNode
}

export const ForkDetailsCard = ({ gauge }: ForkDetailsCardProps) => {
	const { rawData } = useForkData()
	const [isOpen, setIsOpen] = useState(false)

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

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			{/* Entire Gauge as DialogTrigger */}
			<DialogTrigger asChild>
				<button
					type="button"
					className="relative inline-block group cursor-pointer focus:outline-hidden transition-all duration-200"
					aria-label="View fork meter details"
					title="Click for more information"
				>
					{/* Gauge */}
					<div className="mb-2">
						{gauge}
					</div>

					{/* Info Icon - Top Right */}
					<InfoIcon className="absolute -top-2 -right-2 p-2 rounded-full" />
				</button>
			</DialogTrigger>

			{/* Modal Dialog */}
			<DialogContent className="bg-background border border-foreground/30 backdrop-blur-sm overflow-y-auto">
				{/* Header with Accent and Close Button */}
				<div className="mb-4">
					<div className="flex items-center justify-between mb-2">
						<div className="grid grid-cols-[auto_auto_auto] gap-x-2">
							<div className="h-2 w-12 bg-muted-foreground/50" />
							<div className="h-2 w-8 bg-muted-foreground/50" />
							<div className="h-2 w-4 bg-muted-foreground/50" />
						</div>
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
					<div className="flex justify-center">
						<ForkAsciiArt />
					</div>
					<div className="text-left uppercase">
						<div className="pb-2 mb-2 border-b text-loud-foreground border-muted-foreground border-dashed font-bold">What's a fork?</div>
						<p className="text-sm font-normal leading-tight">Forking is the last market resolution method. It is a very disruptive process and is intended to be a rare occurrence.</p>
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
			</DialogContent>
		</Dialog>
	)
}

const CTAButton = ({ href, children, target, rel }: { href: string; children: React.ReactNode; target?: '_blank'; rel?: string }) => (
	<Button
		variant="outline"
		href={href}
		target={target}
		rel={rel}
		className={cn(
			'w-full',
			'font-normal uppercase text-foreground hover:text-loud-foreground focus:text-loud-foreground',
			'hover:bg-foreground/5 focus:bg-foreground/5',
			'border-foreground/30 hover:border-foreground/60 focus:border-foreground/60'
		)}
	>{ children }
	</Button>
)

const DocumentIcon = () => (
	<svg width="16" height="16" className="mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
		<path d="M14 2v4a2 2 0 0 0 2 2h4"/>
		<path d="M10 9H8"/>
		<path d="M16 13H8"/>
		<path d="M16 17H8"/>
	</svg>
) 

const InfoIcon = ({ className }: HTMLAttributes<HTMLDivElement>) => {
	return (
		<div
			className={cn(
				'pointer-events-none transition-all duration-200',
				'group-hover:fx-glow group-focus-within:fx-glow',
				'group-hover:scale-125 group-focus-within:scale-125',
				'text-muted-foreground group-focus-within:text-loud-foreground group-hover:text-loud-foreground',
				className
			)}
		>
			{/* Info Icon SVG */}
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
				<circle cx="12" cy="12" r="10" />
				<line x1="12" y1="16" x2="12" y2="12" />
				<line x1="12" y1="8" x2="12.01" y2="8" />
			</svg>
		</div>
	)
}
