import { useEffect, useState } from "react";

interface ScrollIndicatorProps {
	delay?: number; // ms before the indicator first appears
}

export const ScrollIndicator = ({ delay = 0 }: ScrollIndicatorProps) => {
	const [isVisible, setIsVisible] = useState(false);
	const [hasAppeared, setHasAppeared] = useState(delay === 0);

	useEffect(() => {
		let scrollTimeout: NodeJS.Timeout | null = null;

		const handleScroll = () => {
			// Clear existing timeout if any
			if (scrollTimeout) {
				clearTimeout(scrollTimeout);
			}

			// Use requestAnimationFrame for better performance
			scrollTimeout = setTimeout(() => {
				const scrollY = window.scrollY;
				const viewportHeight = window.innerHeight;

				// Show indicator only when scrollY is less than viewport height
				const shouldBeVisible = scrollY < viewportHeight;
				setIsVisible(shouldBeVisible);
			}, 10);
		};

		// Add scroll listener
		window.addEventListener("scroll", handleScroll);

		// Initialize visibility after delay
		const appearTimeout = setTimeout(() => {
			setHasAppeared(true);
			handleScroll();
		}, delay);

		// Cleanup
		return () => {
			window.removeEventListener("scroll", handleScroll);
			if (scrollTimeout) clearTimeout(scrollTimeout);
			clearTimeout(appearTimeout);
		};
	}, [delay]);

	const visible = hasAppeared && isVisible;

	return (
		<div
			className={`fixed bottom-6 right-8 z-10 hidden transition-opacity duration-500 md:block ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
		>
			<div className="scroll-indicator-portal" aria-hidden="true">
				<svg
					className="scroll-indicator-arrow"
					viewBox="0 0 24 24"
					fill="none"
					aria-hidden="true"
				>
					<path d="M12 4v15" />
					<path d="m6 13 6 6 6-6" />
				</svg>
			</div>
		</div>
	);
};
