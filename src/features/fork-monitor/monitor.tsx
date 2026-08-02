import type React from "react";
import { ForkDataProvider } from "./data-provider";
import ForkDisplay from "./display";
import { ForkClockProvider } from "./clock";
import { ErrorBoundary } from "./error-boundary";
import { ForkMockProvider } from "./mock-provider";

interface ForkMonitorProps {
	animated?: boolean;
}

interface ForkExperienceProps {
	children: React.ReactNode;
}

export const ForkExperience: React.FC<ForkExperienceProps> = ({ children }) => {
	return (
		<ErrorBoundary
			fallback={
				<div className="text-muted-foreground text-sm">Gauge unavailable</div>
			}
		>
			<ForkDataProvider>
				<ForkMockProvider>
					<ForkClockProvider>
						{children}
					</ForkClockProvider>
				</ForkMockProvider>
			</ForkDataProvider>
		</ErrorBoundary>
	);
};

export const ForkMonitor: React.FC<ForkMonitorProps> = ({
	animated = true,
}) => {
	return (
		<ForkExperience>
			<div className="hero-fork-meter py-6">
				<ForkDisplay animated={animated} />
			</div>
		</ForkExperience>
	);
};

export default ForkMonitor;
