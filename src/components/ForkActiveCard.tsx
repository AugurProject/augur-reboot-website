import { useEffect, useState } from 'react'
import { useForkData } from '../providers/ForkDataProvider'

const OUTCOME_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const

const formatRep = (n: number): string => Math.round(n).toLocaleString()

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

	const totalMigrated = fork.outcomes.reduce((s, o) => s + o.migratedRep, 0)
	const goalPercent = Math.min(100, (fork.forkReputationGoal / fork.universeRepSupply) * 100)
	const unmigrated = Math.max(0, fork.universeRepSupply - totalMigrated)

	// Each segment is sized as fraction of universe supply (not of migrated total),
	// so the bar grows as migration progresses and the goal tick remains anchored.
	// Opacity is ranked by migrated REP — brightest for the leading universe.
	const SHADES = ['#2ae7a8', '#1f9d72', '#15614a', '#0e3d30', '#0a2620', '#071916']
	const rankByMigrated = [...fork.outcomes]
		.map((o, i) => ({ i, m: o.migratedRep }))
		.sort((a, b) => b.m - a.m)
		.reduce<Record<number, number>>((acc, { i }, rank) => {
			acc[i] = rank
			return acc
		}, {})
	const segments = fork.outcomes.map((o, i) => ({
		...o,
		letter: OUTCOME_LETTERS[i] ?? '?',
		widthPercent: (o.migratedRep / fork.universeRepSupply) * 100,
		color: SHADES[rankByMigrated[i] ?? 0] ?? SHADES[SHADES.length - 1],
	}))

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
				<div className="text-xs uppercase tracking-widest text-primary">FORK // ACTIVE</div>
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
									// backgroundImage: 'linear-gradient(rgba(42,231,168,0.04), rgba(42,231,168,0.04))',
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
				<div className="relative">
					<div
						className="relative h-6 w-full mb-1 overflow-hidden"
						style={{
							backgroundImage:
								'repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0 4px, transparent 4px 8px)',
							backgroundColor: 'rgba(255,255,255,0.02)',
						}}
					>
						{segments.reduce<{ nodes: React.ReactNode[]; offset: number }>(
							(acc, seg) => {
								acc.nodes.push(
									<div
										key={seg.index}
										className="absolute top-0 bottom-0 border-r border-background/30 text-[10px] text-background flex items-center justify-center"
										style={{ left: `${acc.offset}%`, width: `${seg.widthPercent}%`, backgroundColor: seg.color }}
										title={`${seg.label}: ${formatRep(seg.migratedRep)} REP`}
									>
										{seg.widthPercent > 3 ? seg.letter : ''}
									</div>,
								)
								acc.offset += seg.widthPercent
								return acc
							},
							{ nodes: [], offset: 0 },
						).nodes}
					</div>

					<div
						className="pointer-events-none absolute -top-2 bottom-1 border-l border-dashed border-primary"
						style={{ left: `${goalPercent}%` }}
						title={`Early-resolution goal: ${formatRep(fork.forkReputationGoal)} REP`}
					>
						<div className="absolute -top-4 -translate-x-1/2 text-[10px] text-primary whitespace-nowrap">
							▼ goal
						</div>
					</div>
				</div>

				<div className="flex justify-between text-[10px] text-muted-foreground mb-4">
					<span>0</span>
					<span>{formatRep(fork.universeRepSupply)} REP</span>
				</div>

				<ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 mb-3 text-xs text-muted-foreground">
					{segments.map(seg => (
						<li key={seg.index} className="tabular-nums flex items-center gap-1.5">
							<span
								className="inline-block w-2.5 h-2.5"
								style={{ backgroundColor: seg.color }}
							/>
							<span className="text-primary">{seg.letter}</span>
							{seg.label} ({seg.widthPercent.toFixed(1)}%)
						</li>
					))}
				</ul>

				<div className="text-xs text-center text-muted-foreground">
					{((unmigrated / fork.universeRepSupply) * 100).toFixed(1)}% unmigrated
				</div>
			</div>

		</div>
	)
}

export default ForkActiveCard
