import type React from "react";
import { ForkDataProvider } from "../providers/ForkDataProvider";
import { ForkMockProvider } from "../providers/ForkMockProvider";
import { ErrorBoundary } from "./ErrorBoundary";
import ForkDisplay from "./ForkDisplay";

interface ForkMonitorProps {
	animated?: boolean;
}

export const ForkMonitor: React.FC<ForkMonitorProps> = ({
	animated = true,
}) => {
	return (
		<ErrorBoundary
			fallback={
				<div className="text-muted-foreground text-sm">Gauge unavailable</div>
			}
		>
			<ForkDataProvider>
				<ForkMockProvider>
					<ForkDisplay animated={animated} />
				</ForkMockProvider>
			</ForkDataProvider>
		</ErrorBoundary>
	);
};

export default ForkMonitor;
