import { useEffect, useRef, useState } from "react";

interface LearnNavigationEntry {
	label: string;
	path: string;
	status: "available" | "archived" | "planned";
}

interface LearnNavigationProps {
	currentPath: string;
	topicLabel: string;
	entries: LearnNavigationEntry[];
}

function getNavigationLabel(entry: LearnNavigationEntry): string {
	return entry.status === "archived" ? `${entry.label} · ARCHIVED` : entry.label;
}

export default function LearnNavigation({
	currentPath,
	topicLabel,
	entries,
}: LearnNavigationProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const drawerRef = useRef<HTMLDivElement>(null);

	const currentIndex = entries.findIndex((entry) => entry.path === currentPath);
	const nextEntry =
		currentIndex < entries.length - 1 ? entries[currentIndex + 1] : null;

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				drawerRef.current &&
				!drawerRef.current.contains(event.target as Node)
			) {
				setIsExpanded(false);
			}
		}

		if (isExpanded) {
			document.addEventListener("mousedown", handleClickOutside);
			return () =>
				document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [isExpanded]);

	return (
		<aside
			ref={drawerRef}
			className="sticky bottom-0 border-t border-foreground/30 bg-background uppercase font-display transition-all duration-300"
			style={{
				zIndex: isExpanded ? 50 : 10,
			}}
		>
			<div className="max-w-2xl mx-auto px-4 md:px-8 py-3 md:py-6 w-full">
				<div className="flex items-center justify-between">
					<button
						type="button"
						onClick={() => setIsExpanded(!isExpanded)}
						className={`text-sm font-light tracking-widest uppercase transition-colors cursor-pointer ${
							isExpanded
								? "text-muted-foreground hover:text-loud-foreground focus:text-loud-foreground hover:fx-glow focus:fx-glow"
								: "text-muted-foreground hover:text-primary"
						}`}
					>
						{isExpanded
							? "[ X ] CLOSE"
							: `JUMP TO ${topicLabel.toUpperCase()} →`}
					</button>

					{nextEntry ? (
						<a
							href={nextEntry.path}
							className="text-sm font-light tracking-widest text-muted-foreground hover:text-primary transition-colors"
						>
							UP NEXT: {getNavigationLabel(nextEntry)}
						</a>
					) : (
						<span className="text-sm font-light tracking-widest text-muted-foreground">
							END OF {topicLabel.toUpperCase()}
						</span>
					)}
				</div>
			</div>

			{isExpanded && (
				<div className="border-t border-foreground/30 bg-background overflow-hidden animate-in fade-in duration-200 w-full">
					<div className="max-w-2xl mx-auto px-4 md:px-8 py-4 w-full">
						<div className="mb-3 text-xs tracking-widest text-muted-foreground">
							{topicLabel}
						</div>
						<div className="space-y-2">
							{entries.map((entry) => {
								const isActive = currentPath === entry.path;
								const base =
									"flex items-center gap-2 text-sm font-light uppercase tracking-widest px-3 py-2 transition-colors";
								const cls = isActive
									? "bg-foreground/10 text-primary border border-foreground/30"
									: "text-muted-foreground hover:text-foreground hover:bg-foreground/5";
								return (
									<a
										key={entry.path}
										href={entry.path}
										className={`${base} ${cls}`}
									>
										<span>{getNavigationLabel(entry)}</span>
									</a>
								);
								})}
						</div>
					</div>
				</div>
			)}
		</aside>
	);
}
