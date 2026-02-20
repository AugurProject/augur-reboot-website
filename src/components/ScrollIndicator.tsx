import { useEffect, useState } from "react";

export const ScrollIndicator = () => {
	const [isVisible, setIsVisible] = useState(true);

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

		// Initialize visibility on mount
		handleScroll();

		// Cleanup
		return () => {
			window.removeEventListener("scroll", handleScroll);
			if (scrollTimeout) {
				clearTimeout(scrollTimeout);
			}
		};
	}, []);

	return (
		<div
			className={`fixed bottom-8 right-8 z-10 transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
		>
			<div className="scroll-indicator-keycap" />
		</div>
	);
};
