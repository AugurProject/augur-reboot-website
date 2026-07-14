import type React from "react";
import { ForkDataProvider } from "./data-provider";
import { ErrorBoundary } from "./error-boundary";
import ForkDisplay from "./display";
import { ForkMockProvider } from "./mock-provider";

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
