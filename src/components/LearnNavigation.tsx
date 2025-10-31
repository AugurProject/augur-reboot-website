import React, { useState, useRef, useEffect } from 'react'

interface Topic {
	title: string
	slug: string
	path: string
}

interface LearnNavigationProps {
	currentPath: string
	currentTitle: string
	topics: Topic[]
}

export default function LearnNavigation({
	currentPath,
	currentTitle,
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
		<nav
			ref={drawerRef}
			className="sticky bottom-0 border-t border-foreground/30 bg-background uppercase transition-all duration-300"
			style={{
				zIndex: isExpanded ? 50 : 10,
			}}
		>
			{/* Collapsed State */}
			<div className="max-w-5xl mx-auto px-4 md:px-8 py-3 md:py-6">
				<div className="flex items-center justify-between">
					{/* Left: Jump to Topic */}
					<button
						onClick={() => setIsExpanded(!isExpanded)}
						className="text-xs font-light tracking-widest text-muted-foreground hover:text-primary transition-colors cursor-pointer"
					>
						{isExpanded ? '← CLOSE' : 'JUMP TO TOPIC →'}
					</button>

					{/* Right: Up Next */}
					{nextTopic ? (
						<a
							href={nextTopic.path}
							className="text-xs font-light tracking-widest text-muted-foreground hover:text-primary transition-colors"
						>
							UP NEXT: {nextTopic.title}
						</a>
					) : (
						<span className="text-xs font-light tracking-widest text-muted-foreground">
							END OF TOPICS
						</span>
					)}
				</div>
			</div>

			{/* Expanded Drawer */}
			{isExpanded && (
				<div className="border-t border-foreground/30 bg-background overflow-hidden animate-in fade-in duration-200">
					<div className="max-w-5xl mx-auto px-4 md:px-8 py-4">
						<div className="space-y-2">
							{topics.map((topic) => (
								<a
									key={topic.path}
									href={topic.path}
									className={`block text-sm font-light uppercase tracking-widest px-3 py-2 transition-colors ${
										currentPath === topic.path
											? 'bg-foreground/10 text-primary border border-foreground/30'
											: 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
									}`}
								>
									{topic.title}
								</a>
							))}
						</div>
					</div>
				</div>
			)}
		</nav>
	)
}
