import { useEffect, useRef } from "react";
import PageHeader from "@/components/shell/page-header";
import AsciiText from "@/components/ui/ascii-text";
import { AugurLogo } from "@/components/ui/icons";
import { useForkClock } from "@/features/fork-monitor/clock";
import { useForkData } from "@/features/fork-monitor/data-provider";
import { deriveForkLifecycle } from "@/features/fork-monitor/derive-fork-lifecycle";
import ForkDisplay from "@/features/fork-monitor/display";
import ForkAction from "@/features/fork-monitor/fork-action";
import { ForkExperience } from "@/features/fork-monitor/monitor";
import { ScrollIndicator } from "./scroll-indicator";
import TypewriterSequence from "./typewriter-sequence";

const ASCII_ART = `██╗ ███████╗     ██████╗  ███████╗ ██████╗   ██████╗   ██████╗  ████████╗ ██╗ ███╗   ██╗  ██████╗
██║ ██╔════╝     ██╔══██╗ ██╔════╝ ██╔══██╗ ██╔═══██╗ ██╔═══██╗ ╚══██╔══╝ ██║ ████╗  ██║ ██╔════╝
 ██║ ███████╗     ██████╔╝ █████╗   ██████╔╝ ██║   ██║ ██║   ██║    ██║    ██║ ██╔██╗ ██║ ██║  ███╗
 ██║ ╚════██║     ██╔══██╗ ██╔══╝   ██╔══██╗ ██║   ██║ ██║   ██║    ██║    ██║ ██║╚██╗██║ ██║   ██║
 ██║ ███████║     ██║  ██║ ███████╗ ██████╔╝ ╚██████╔╝ ╚██████╔╝    ██║    ██║ ██║ ╚████║ ╚██████╔╝
╚═╝ ╚══════╝     ╚═╝  ╚═╝ ╚══════╝ ╚═════╝   ╚═════╝   ╚═════╝     ╚═╝    ╚═╝ ╚═╝  ╚═══╝  ╚═════╝`;

const RESOLUTION_MESSAGES = [
	"THE PROTOCOL REACHED CONSENSUS",
	"A CANONICAL UNIVERSE EMERGED",
	"THE REBOOT CONTINUES...",
];

const ForkResolutionMessage: React.FC = () => {
	const { rawData } = useForkData();
	const now = useForkClock();
	const lifecycle = deriveForkLifecycle(rawData, Math.floor(now / 1000));

	if (lifecycle.state !== "migration-closed-resolved") return null;

	return (
		<div
			className="h-12 min-w-sm grid place-content-center text-sm text-center text-foreground font-light tracking-wide border border-muted-foreground/60 px-4"
			aria-live="polite"
		>
			<TypewriterSequence
				sentences={RESOLUTION_MESSAGES}
				defaultTypingSpeed={45}
				delayBetweenSentences={1000}
				holdDuration={3800}
				loop
			/>
		</div>
	);
};

const HeroBanner: React.FC = () => {
	const menuItem1Ref = useRef<HTMLAnchorElement>(null);

	// Focus the first menu item once the entrance animation finishes.
	// Animation kicks off either on page load (no .boot class) or when Intro
	// removes .boot. Listen for animationend on the menu item itself.
	useEffect(() => {
		const el = menuItem1Ref.current;
		if (!el) return;
		const handle = () => el.focus({ preventScroll: true });
		el.addEventListener("animationend", handle, { once: true });
		return () => el.removeEventListener("animationend", handle);
	}, []);

	return (
		<ForkExperience>
			<div className="h-screen min-h-fit w-full relative">
				<div className="grid grid-rows-[auto_auto_auto] min-h-full z-10 text-center content-between">
					<div className="hero-header-row">
						<PageHeader />
					</div>

					{/* Middle Section */}
					<div className="flex flex-col items-center place-items-center py-8 gap-y-4">
						<span className="hero-logo">
							<AugurLogo className="text-9xl" />
						</span>
						<p className="hero-prediction-market font-light font-display border border-foreground/20 px-3 py-1 mx-4 sm:text-xl tracking-widest leading-none uppercase">
							THE FRONTIER OF PREDICTION MARKETS
						</p>

						<h2 className="grid grid-cols-[minmax(0.25rem,1rem)_1fr_minmax(0.25rem,1rem)] items-center gap-x-4">
							<span className="hero-line-left h-px bg-foreground" />
							<AsciiText
								className="hero-ascii text-[clamp(0.325rem,1vw,0.625rem)] leading-[1.1]"
								content={ASCII_ART}
							/>
							<span className="hero-line-right h-px bg-foreground" />
						</h2>

						<div className="flex flex-col place-items-center text-left w-full max-w-3xl mx-auto mb-3">
							<a
								ref={menuItem1Ref}
								href="/mission"
								className="hero-menu-1 menu-link font-display text-xl sm:text-3xl font-bold text-foreground hover:text-loud-foreground focus:text-loud-foreground block hover:fx-glow focus:fx-glow focus:outline-none uppercase"
							>
								THE NEXT GENERATION OF ORACLES
							</a>
							<a
								href="/team"
								className="hero-menu-2 menu-link font-display text-xl sm:text-3xl font-bold text-foreground hover:text-loud-foreground focus:text-loud-foreground block hover:fx-glow focus:fx-glow focus:outline-none uppercase"
							>
								THE MINDS BEHIND THE REBOOT
							</a>
						</div>

						<ForkResolutionMessage />

						{/* Fork CTA */}
						<ForkAction />
					</div>

					{/* Bottom Section: Fork Monitor */}
					<div className="hero-fork-meter py-6">
						<ForkDisplay animated={true} />
					</div>
				</div>

				<ScrollIndicator delay={3200} />
			</div>
		</ForkExperience>
	);
};

export default HeroBanner;
