import { SirenIcon } from "@phosphor-icons/react";
import type React from "react";
import BorderBeam from "@/components/ui/border-beam";
import { useForkClock } from "./clock";
import { useForkData } from "./data-provider";
import { deriveForkLifecycle } from "./derive-fork-lifecycle";

const ForkAction = (): React.JSX.Element | null => {
	const { rawData } = useForkData();
	const now = useForkClock();

	const lifecycle = deriveForkLifecycle(rawData, Math.floor(now / 1000));
	const migrationIsOpen =
		lifecycle.state === "migration-open" ||
		lifecycle.state === "migration-open-resolved";

	if (!migrationIsOpen) return null;

	return (
		<div className="hero-fork-cta">
			<div className="motion-safe:animate-[bob_2s_ease-in-out_infinite]">
				<BorderBeam duration={2.5}>
					<a
						href="/learn/fork/migration/"
						className="font-display bg-foreground/5 tracking-wide flex items-center px-4 py-2 sm:text-xl font-semibold text-loud-foreground uppercase shadow-[0_0_10px_oklch(from_var(--color-foreground)_l_c_h/_0.4)] hover:fx-glow-sm focus:fx-glow-sm focus:outline-none whitespace-nowrap"
					>
						<SirenIcon className="w-6 h-6 border-muted-foreground/80 rounded-full p-1 mr-3" />
						{lifecycle.winnerKnown
							? "MIGRATION WINDOW CLOSING, ACT NOW!"
							: "THE FORK IS HERE! OWN REP? ACT NOW."}
					</a>
				</BorderBeam>
			</div>
		</div>
	);
};

export default ForkAction;
