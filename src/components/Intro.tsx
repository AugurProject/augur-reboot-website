import { useCallback, useEffect, useState } from "react";
import CrtDisplay from "./CrtDisplay";
import Pointer from "./Pointer";
import TypewriterSequence from "./TypewriterSequence";
import Button from "./ui/Button";

const bootSentences: string[] = [
	"", // Start with a blank line for the "warm-up"
	"RESEARCH AND DEVELOPMENT HAS RETURNED TO ETHEREUM'S FIRST ICO",
	"PERFORMING SYSTEM CHECKS... UPDATE REQUIRED",
	"AUGUR REBOOT BEGINS",
];

function exitBoot() {
	sessionStorage.setItem("skipIntro", "1");
	requestAnimationFrame(() => {
		document.documentElement.classList.remove("boot");
	});
}

const Intro: React.FC = () => {
	const [isPoweredOn, setIsPoweredOn] = useState(true);

	const handleSequenceComplete = () => {
		setTimeout(() => {
			setIsPoweredOn(false);
			setTimeout(() => {
				setIsPoweredOn(true);
				setTimeout(() => {
					exitBoot();
				}, 500);
			}, 200);
		}, 1000);
	};

	const handleSkipClick = useCallback(() => {
		exitBoot();
	}, []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				handleSkipClick();
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [handleSkipClick]);

	return (
		<div id="crt-overlay">
			<CrtDisplay isPoweredUp={isPoweredOn}>
				<Button
					onClick={handleSkipClick}
					variant="link"
					size="lg"
					className="fixed top-8 right-10 z-50 text-muted-foreground hover:no-underline"
				>
					<Pointer animated="auto" direction="right" />
					SKIP INTRO (ESC)
				</Button>
				<div className="flex items-center justify-center h-screen uppercase font-display text-foreground text-2xl">
					<TypewriterSequence
						sentences={bootSentences}
						defaultTypingSpeed={40}
						onSequenceComplete={handleSequenceComplete}
					/>
				</div>
			</CrtDisplay>
		</div>
	);
};

export default Intro;
