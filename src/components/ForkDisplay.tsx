import type React from "react";
import { useForkData } from "../providers/ForkDataProvider";
import { ForkActiveCard } from "./ForkActiveCard";
import { ForkControls } from "./ForkControls";
import { ForkDetailsCard } from "./ForkDetailsCard";
import { ForkGauge } from "./ForkGauge";
import { ForkStats } from "./ForkStats";

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
	const isForking = rawData.metrics.disputeDetails[0]?.marketId === "FORKING";

	return (
		<>
			<div className="w-full text-center">
				{isLoading && (
					<div className="mb-4 text-muted-foreground">
						Loading fork risk data...
					</div>
				)}

				{error && <div className="mb-4 text-orange-400">Warning: {error}</div>}

				{isForking ? (
					<ForkActiveCard />
				) : (
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
