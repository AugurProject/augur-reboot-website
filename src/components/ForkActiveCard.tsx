import { useEffect, useState } from 'react'
import { useForkData } from '../providers/ForkDataProvider'

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
		<div className="w-full max-w-xl mx-auto px-4 text-left font-mono text-sm">
			<div className="flex justify-between items-center mb-4">
				<div className="text-xs uppercase tracking-widest text-primary">{"FORK // ACTIVE"}</div>
				<a
					href="/learn/fork/migration/"
					title="How to migrate REP"
					aria-label="How to migrate REP"
					className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary transition"
				>
					<span className="inline-flex items-center justify-center w-5 h-5 tracking-tight leading-none rounded-full border border-current">?</span>
					help
				</a>
			</div>

			<div
				className="mb-2 bg-foreground/30"
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
			<div className="text-center text-muted-foreground mb-6">
				remaining in 60-day migration window
			</div>

			<div className="mb-4 pt-5">
				<div className="text-center mb-3">
					<span className="text-sm uppercase tracking-widest">
						<span className="text-primary fx-glow-sm tabular-nums">{migratedPercent.toFixed(1)}%</span>
						{' '}
						<span className="text-muted-foreground">REP migrated</span>
					</span>
				</div>

				<div
					className="relative h-6 w-full mb-2 overflow-hidden"
					style={{
						backgroundImage:
							'repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0 4px, transparent 4px 8px)',
						backgroundColor: 'rgba(255,255,255,0.02)',
					}}
				>
					<div
						className="absolute top-0 bottom-0 left-0 transition-all duration-1000 ease-out"
						style={{
							width: `${migratedPercent}%`,
							background: 'var(--color-foreground)',
						}}
					/>
				</div>

				<div className="flex justify-between text-[10px] text-muted-foreground">
					<span>{formatRep(migratedRep)} / {formatRep(TOTAL_SUPPLY)}</span>
				</div>
			</div>

		</div>
	)
}

export default ForkActiveCard
