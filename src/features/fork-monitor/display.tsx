import type React from "react";
import { ForkActiveCard } from "./active-card";
import { useForkClock } from "./clock";
import { ForkControls } from "./controls";
import { useForkData } from "./data-provider";
import { deriveForkLifecycle } from "./derive-fork-lifecycle";
import { ForkDetailsCard } from "./details-card";
import { ForkGauge } from "./gauge";
import { ForkRecord, ForkResolutionPending } from "./post-fork-record";
import { ForkStats } from "./stats";

// Helper function to format timestamps as relative time
function formatRelativeTime(isoTimestamp: string): string {
	const date = new Date(isoTimestamp);
	const now = new Date();
	const diff = now.getTime() - date.getTime();

	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (seconds < 60) return "just now";
	if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
	if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
	if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;

	return date.toLocaleDateString();
}

interface ForkDisplayProps {
	animated?: boolean;
}

const ForkDisplay: React.FC<ForkDisplayProps> = ({ animated = true }) => {
	const { gaugeData, riskLevel, lastUpdated, isLoading, error, rawData } =
		useForkData();
	const now = useForkClock();
	const lifecycle = deriveForkLifecycle(rawData, Math.floor(now / 1000));

	return (
		<>
			<div className="w-full text-center">
				{isLoading && (
					<div className="mb-4 text-muted-foreground">
						Loading fork risk data...
					</div>
				)}

				{error && <div className="mb-4 text-orange-400">Warning: {error}</div>}

				{(lifecycle.state === "migration-open" ||
					lifecycle.state === "migration-open-resolved") && <ForkActiveCard />}

				{lifecycle.state === "migration-closed-resolved" && <ForkRecord />}

				{lifecycle.state === "migration-closed-unverified" && (
					<ForkResolutionPending />
				)}

				{lifecycle.state === "data-unavailable" && (
					<div className="mx-auto max-w-xl border border-orange-500/30 bg-orange-500/5 p-5 text-left font-mono text-sm text-orange-300">
						<div className="text-xs uppercase tracking-widest">
							Fork data unavailable
						</div>
						<p className="mt-2 font-prose text-muted-foreground">
							The site is withholding a fork status claim until the fork JSON
							data can be verified.
						</p>
					</div>
				)}

				{lifecycle.state === "monitoring" && (
					<>
						{/* Gauge with Details Card - ForkDetailsCard wraps the gauge */}
						<ForkDetailsCard
							gauge={
								<ForkGauge
									percentage={gaugeData.percentage}
									riskLevel={riskLevel.level.toLowerCase()}
									animated={animated}
								/>
							}
						/>

						<ForkStats />

						<button
							type="button"
							className="text-sm cursor-help text-center text-muted-foreground hover:underline hover:text-foreground focus:underline focus:text-foreground underline-offset-2 outline-none"
							title={`Last changed: ${formatRelativeTime(lastUpdated)}`}
						>
							<span>* levels are monitored hourly</span>
						</button>
					</>
				)}
			</div>

			{/* Demo overlay - only visible in development */}
			<ForkControls />
		</>
	);
};

export default ForkDisplay;
