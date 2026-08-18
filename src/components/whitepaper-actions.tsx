import { useEffect, useRef, useState, type FC } from "react";

interface WhitepaperActionsProps {
	markdownHref: string;
	chatGptHref: string;
	claudeHref: string;
}

type CopyState = "idle" | "copying" | "copied" | "error";

const WhitepaperActions: FC<WhitepaperActionsProps> = ({
	markdownHref,
	chatGptHref,
	claudeHref,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [copyState, setCopyState] = useState<CopyState>("idle");
	const menuRef = useRef<HTMLDivElement>(null);
	const resetTimeoutRef = useRef<number | undefined>(undefined);

	useEffect(() => {
		const handlePointerDown = (event: PointerEvent) => {
			if (!menuRef.current?.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setIsOpen(false);
		};

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
			if (resetTimeoutRef.current !== undefined) {
				window.clearTimeout(resetTimeoutRef.current);
			}
		};
	}, []);

	const setTemporaryState = (state: CopyState) => {
		setCopyState(state);
		if (resetTimeoutRef.current !== undefined) {
			window.clearTimeout(resetTimeoutRef.current);
		}
		resetTimeoutRef.current = window.setTimeout(
			() => setCopyState("idle"),
			state === "copied" ? 1800 : 3000,
		);
	};

	const copyPage = async () => {
		setTemporaryState("copying");

		try {
			const response = await fetch(markdownHref, {
				headers: { Accept: "text/markdown" },
			});
			if (!response.ok) throw new Error(`Markdown request failed: ${response.status}`);

			const markdown = await response.text();
			if (!navigator.clipboard?.writeText) throw new Error("Clipboard is unavailable");
			await navigator.clipboard.writeText(markdown);

			setTemporaryState("copied");
		} catch {
			setTemporaryState("error");
		}
	};

	const copyLabel = {
		idle: "Copy page",
		copying: "Copying…",
		copied: "Copied",
		error: "Copy failed",
	}[copyState];

	return (
		<div ref={menuRef} className="relative inline-flex font-display text-xs uppercase tracking-[0.15em]">
			<div className="inline-flex">
				<button
					type="button"
					onClick={copyPage}
					disabled={copyState === "copying"}
					className="inline-flex h-9 items-center gap-2 border border-primary bg-primary px-3 text-background uppercase transition-colors hover:bg-primary/90 focus:z-10 focus:outline-none focus:ring-2 focus:ring-primary/60 disabled:pointer-events-none disabled:opacity-70"
				>
					{copyState === "copied" ? (
						<svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none">
							<path d="m3 8 3 3 7-7" stroke="currentColor" strokeWidth="1.5" />
						</svg>
					) : (
						<svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none">
							<rect x="5.25" y="5.25" width="7.5" height="7.5" stroke="currentColor" strokeWidth="1.5" />
							<path d="M10.75 5.25V3.5H3.5v7.25h1.75" stroke="currentColor" strokeWidth="1.5" />
						</svg>
					)}
					{copyLabel}
				</button>
				<button
					type="button"
					aria-label="More whitepaper actions"
					aria-haspopup="menu"
					aria-expanded={isOpen}
					aria-controls="whitepaper-actions-menu"
					onClick={() => setIsOpen((open) => !open)}
					className="inline-flex h-9 w-9 items-center justify-center border-y border-r border-primary border-l-background/30 bg-primary text-background transition-colors hover:bg-primary/90 focus:z-10 focus:outline-none focus:ring-2 focus:ring-primary/60"
				>
					<svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none">
						<path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
					</svg>
				</button>
			</div>

			{isOpen && (
				<div
					id="whitepaper-actions-menu"
					role="menu"
					className="absolute right-0 top-full z-30 mt-2 min-w-48 border border-primary/40 bg-background p-1 shadow-[0_0_2em_oklch(from_var(--color-primary)_l_c_h_/0.12)]"
				>
					<a
						href={markdownHref}
						target="_blank"
						rel="noopener noreferrer"
						role="menuitem"
						onClick={() => setIsOpen(false)}
						className="block px-3 py-2 text-left text-foreground transition-colors hover:bg-foreground/10 hover:text-loud-foreground focus:bg-foreground/10 focus:text-loud-foreground focus:outline-none"
					>
						View as Markdown
					</a>
					<a
						href={chatGptHref}
						target="_blank"
						rel="noopener noreferrer"
						role="menuitem"
						onClick={() => setIsOpen(false)}
						className="block px-3 py-2 text-left text-foreground transition-colors hover:bg-foreground/10 hover:text-loud-foreground focus:bg-foreground/10 focus:text-loud-foreground focus:outline-none"
					>
						Open in ChatGPT
					</a>
					<a
						href={claudeHref}
						target="_blank"
						rel="noopener noreferrer"
						role="menuitem"
						onClick={() => setIsOpen(false)}
						className="block px-3 py-2 text-left text-foreground transition-colors hover:bg-foreground/10 hover:text-loud-foreground focus:bg-foreground/10 focus:text-loud-foreground focus:outline-none"
					>
						Open in Claude
					</a>
				</div>
			)}
		</div>
	);
};

export default WhitepaperActions;
