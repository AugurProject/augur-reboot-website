import { useState, useRef, useEffect } from 'react'

interface Topic {
	title: string
	slug: string
	path: string
	critical?: boolean
}

interface LearnNavigationProps {
	currentPath: string
	currentTitle: string
	topics: Topic[]
}

export default function LearnNavigation({
	currentPath,
	topics,
}: LearnNavigationProps) {
	const [isExpanded, setIsExpanded] = useState(false)
	const drawerRef = useRef<HTMLDivElement>(null)

	// Find current topic and next topic
	const currentIndex = topics.findIndex((t) => t.path === currentPath)
	const nextTopic = currentIndex < topics.length - 1 ? topics[currentIndex + 1] : null

	// Close drawer when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
				setIsExpanded(false)
			}
		}

		if (isExpanded) {
			document.addEventListener('mousedown', handleClickOutside)
			return () => document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isExpanded])

	return (
		<aside
			ref={drawerRef}
			className="sticky bottom-0 border-t border-foreground/30 bg-background uppercase font-display transition-all duration-300"
			style={{
				zIndex: isExpanded ? 50 : 10,
			}}
		>
			{/* Collapsed State */}
			<div className="max-w-2xl mx-auto px-4 md:px-8 py-3 md:py-6 w-full">
				<div className="flex items-center justify-between">
					{/* Left: Jump to Topic */}
					<button
						type="button"
						onClick={() => setIsExpanded(!isExpanded)}
						className={`text-sm font-light tracking-widest uppercase transition-colors cursor-pointer ${
							isExpanded
								? 'text-muted-foreground hover:text-loud-foreground focus:text-loud-foreground hover:fx-glow focus:fx-glow'
								: 'text-muted-foreground hover:text-primary'
						}`}
					>
						{isExpanded ? '[ X ] CLOSE' : 'JUMP TO TOPIC →'}
					</button>

					{/* Right: Up Next */}
					{nextTopic ? (
						<a
							href={nextTopic.path}
							className="text-sm font-light tracking-widest text-muted-foreground hover:text-primary transition-colors"
						>
							UP NEXT: {nextTopic.title}
						</a>
					) : (
						<span className="text-sm font-light tracking-widest text-muted-foreground">
							END OF TOPICS
						</span>
					)}
				</div>
			</div>

			{/* Expanded Drawer */}
			{isExpanded && (
				<div className="border-t border-foreground/30 bg-background overflow-hidden animate-in fade-in duration-200 w-full">
					<div className="max-w-2xl mx-auto px-4 md:px-8 py-4 w-full">
						<div className="space-y-2">
							{topics.map((topic) => {
								const isActive = currentPath === topic.path
								const base = 'flex items-center gap-2 text-sm font-light uppercase tracking-widest px-3 py-2 transition-colors'
								const cls = topic.critical
									? isActive
										? 'bg-red-500/10 text-red-500 border border-red-500/60'
										: 'text-red-500 hover:bg-red-500/10 border border-red-500/40'
									: isActive
										? 'bg-foreground/10 text-primary border border-foreground/30'
										: 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
								return (
									<a key={topic.path} href={topic.path} className={`${base} ${cls}`}>
										{topic.critical && (
											<span className="inline-block w-1.5 h-1.5 bg-red-500" aria-hidden="true" />
										)}
										<span>{topic.title}</span>
										{topic.critical && <span className="ml-auto text-[0.65rem] opacity-80">{'// ACT NOW'}</span>}
									</a>
								)
							})}
						</div>
					</div>
				</div>
			)}
		</aside>
	)
}
