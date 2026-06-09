import { useEffect, useState } from 'react'
import { cn } from '../lib/utils'
import { useForkData } from '../providers/ForkDataProvider'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './ui/dialog'
import Button from './ui/Button'

const TOTAL_SUPPLY = 11_000_000

const formatRep = (n: number): string => {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
	return Math.round(n).toLocaleString()
}

const getCountdownParts = (endUnix: number, nowMs: number) => {
	const secs = Math.max(0, endUnix - Math.floor(nowMs / 1000))
	return {
		d: Math.floor(secs / 86400),
		h: Math.floor((secs % 86400) / 3600),
		m: Math.floor((secs % 3600) / 60),
		s: Math.floor(secs % 60),
	}
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0')

export const ForkActiveCard = (): React.JSX.Element | null => {
	const { rawData } = useForkData()
	const fork = rawData.forkActive
	const [now, setNow] = useState<number>(() => Date.now())
	const [isHelpOpen, setIsHelpOpen] = useState(false)

	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), 1000)
		return () => clearInterval(id)
	}, [])

	if (!fork) return null

	const migratedRep = fork.outcomes.reduce((sum, o) => sum + o.migratedRep, 0)
	const migratedPercent = Math.min(100, (migratedRep / TOTAL_SUPPLY) * 100)

	const t = getCountdownParts(fork.forkEndTime, now)
	const timerCells: Array<{ value: string; label: string }> = [
		{ value: pad(t.d, 2), label: 'DAYS' },
		{ value: pad(t.h), label: 'HRS' },
		{ value: pad(t.m), label: 'MIN' },
		{ value: pad(t.s), label: 'SEC' },
	]

	return (
		<Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
			<div className="w-full max-w-xl mx-auto px-8 text-left font-mono text-sm">
				<DialogTrigger asChild>
					<button
						type="button"
						title="Fork migration help"
						aria-label="Fork migration help"
						className="group block w-full mb-6 cursor-pointer focus:outline-none"
					>
						<div className="flex justify-between items-center mb-4">
							<div className="text-xs uppercase tracking-widest">
								<span className="text-muted-foreground">{'FORK ACTIVE //'}</span>{' '}
								<span className="text-foreground">MIGRATING</span>
							</div>
							<div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground group-hover:text-primary group-focus:text-primary transition">
								what's happening
								<span className="inline-flex items-center justify-center w-5 h-5 tracking-tight leading-none rounded-full border border-current group-hover:fx-glow-sm group-focus:fx-glow-sm">?</span>
							</div>
						</div>

						<div
							className="mb-2 bg-primary/10 group-hover:bg-primary/20 transition-color duration-300"
							style={{
								clipPath: `polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)`,
							}}
						>
							<div className="flex gap-px p-px">
								{timerCells.map((cell, i) => {
									const isFirst = i === 0
									const isLast = i === timerCells.length - 1
									const cellClip = isFirst
										? 'polygon(14px 0, 100% 0, 100% 100%, 0 100%, 0 14px)'
										: isLast
											? 'polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)'
											: undefined
									return (
										<div
											key={cell.label}
											className="flex-1 flex flex-col items-center justify-center py-3 bg-background"
											style={{
												clipPath: cellClip,
											}}
										>
											<div className="text-3xl font-display text-primary tabular-nums leading-none">
												{cell.value}
											</div>
											<div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
												{cell.label}
											</div>
										</div>
									)
								})}
							</div>
						</div>
						<div className="text-center text-muted-foreground">
							remaining in <span className="text-foreground">60-day</span> migration window
						</div>
					</button>
				</DialogTrigger>

				<div className="mb-4 pt-5">
					<div className="text-center mb-3">
						<span className="text-sm uppercase">
							<span className="text-primary fx-glow-sm tabular-nums">{migratedPercent.toFixed(1)}%</span>
							{' '}
							<span className="text-muted-foreground">REP migrated</span>
						</span>
					</div>

				<div
					className="relative h-2 w-full mb-2 overflow-hidden bg-muted-foreground/30"
					// style={{
					// 	backgroundImage:
					// 		'repeating-linear-gradient(-45deg, oklch(from var(--color-primary) l c h / 0.05) 0 4px, transparent 4px 8px)',
					// 	backgroundColor: 'rgba(255,255,255,0.02)',
					// }}
				>
					<div
						className="absolute top-0 bottom-0 left-0 transition-all duration-1000 ease-out"
						style={{
							width: `${migratedPercent}%`,
							background: 'var(--color-foreground)',
						}}
					/>
				</div>

				<div className="flex justify-between text-xs text-muted-foreground">
					<span>{formatRep(migratedRep)} / {formatRep(TOTAL_SUPPLY)}</span>
				</div>
				</div>
			</div>
			<ForkActiveHelpDialog />
		</Dialog>
	)
}

const ForkActiveHelpDialog = () => (
	<DialogContent className="bg-background border border-foreground/10 backdrop-blur-sm overflow-y-auto">
		<DialogTitle className="sr-only">Fork migration help</DialogTitle>
		<div className="mb-4">
			<div className="grid grid-cols-[auto_auto_auto] place-content-start gap-x-2">
				<div className="h-2 w-12 bg-muted-foreground/50" />
				<div className="h-2 w-8 bg-muted-foreground/50" />
				<div className="h-2 w-4 bg-muted-foreground/50" />
			</div>
		</div>

		<div className="p-4 border border-red-500/20 bg-red-800/5 flex items-center gap-4 text-lg tracking-wider">
			<div className="border border-red-500/30 aspect-square h-12 flex items-center justify-center rounded-full">
				<svg className="h-6 w-6 shrink-0 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
					<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
					<path d="M12 9v4" />
					<path d="M12 17h.01" />
				</svg>
			</div>
			<div>
				<span className="uppercase font-display text-red-400 font-bold text-2xl tracking-wide">Migration window closing</span>
				<p className="text-base text-red-400/70 leading-5 tracking-tight">Act now or risk permanently losing your REP!</p>
			</div>
		</div>

		<p className="font-prose text-sm text-balance text-muted-foreground">
			The fork is live and Augur has split into competing universes. Confirm the correct outcome, then use the migration guide to <span className="text-foreground">migrate your REP before the window closes.</span>
		</p>

		<hr className="border-muted-foreground/40 my-2 border-dashed" />

		<div className="space-y-2">
			<CTAButton href="/learn/fork/migration/">
				Full Migration Guide
			</CTAButton>

			<div className="mb-4">
				<div className="my-4 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
					<span className="flex-1 border-t border-dashed border-muted-foreground/40" aria-hidden="true" />
					<span>Official tokens</span>
					<span className="flex-1 border-t border-dashed border-muted-foreground/40" aria-hidden="true" />
				</div>
				<div className="flex items-center gap-2">
					<TokenButton href="https://etherscan.io/address/0x1985365e9f78359a9B6AD760e32412f4a445E862">
						REPv1
					</TokenButton>
					<TokenButton href="https://etherscan.io/token/0x221657776846890989a759ba2973e427dff5c9bb">
						REPv2
					</TokenButton>
					<TokenButton href="https://etherscan.io/token/0xCf6A0A7826fa124B7705d6f3c675eAD76f1e540D">
						REPv2 Yes
					</TokenButton>
				</div>
			</div>

			<CTAButton href="https://6.augurfork.eth.limo/" target="_blank" rel="noopener noreferrer">
				Migration Tool
			</CTAButton>
		</div>
	</DialogContent>
)

const TokenButton = ({ href, children }: { href: string; children: React.ReactNode }) => (
	<Button
		variant="outline"
		href={href}
		target="_blank"
		rel="noopener noreferrer"
		className={cn(
			'w-full px-2',
			'uppercase text-muted-foreground hover:text-loud-foreground focus:text-loud-foreground',
			'hover:bg-foreground/5 focus:bg-foreground/5',
			'border-foreground/20 hover:border-foreground/60 focus:border-foreground/60'
		)}
	>
		{children}
		<svg className="ml-1 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M7 17 17 7" />
			<path d="M7 7h10v10" />
		</svg>
	</Button>
)

const CTAButton = ({ href, children, target, rel }: { href: string; children: React.ReactNode; target?: '_blank'; rel?: string }) => (
	<Button
		variant="outline"
		href={href}
		target={target}
		rel={rel}
		className={cn(
			'w-full',
			'uppercase text-foreground hover:text-loud-foreground focus:text-loud-foreground',
			'hover:bg-foreground/5 focus:bg-foreground/5',
			'border-foreground/30 hover:border-foreground/60 focus:border-foreground/60'
		)}
	>{children}</Button>
)

export default ForkActiveCard
