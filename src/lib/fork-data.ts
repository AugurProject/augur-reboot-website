import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { deriveForkLifecycle } from "@/features/fork-monitor/derive-fork-lifecycle";
import type { ForkRiskData } from "@/features/fork-monitor/types";
import { validateForkRiskData } from "@/features/fork-monitor/validate-fork-data";

const forkDataPath = path.resolve(process.cwd(), "public/data/fork-risk.json");

export const getForkLifecycleAtBuild = () => {
	if (!existsSync(forkDataPath)) {
		return deriveForkLifecycle({
			error: "Fork JSON data is not available during the site build.",
		} as ForkRiskData);
	}

	try {
		const data = JSON.parse(readFileSync(forkDataPath, "utf8")) as ForkRiskData;
		const validation = validateForkRiskData(data);
		if (!validation.valid) {
			return deriveForkLifecycle({
				error: `Fork JSON data failed validation: ${validation.errors.join("; ")}`,
			} as ForkRiskData);
		}
		return deriveForkLifecycle(data);
	} catch {
		return deriveForkLifecycle({
			error: "Fork JSON data could not be read during the site build.",
		} as ForkRiskData);
	}
};

export const isMigrationOpen = (
	state: ReturnType<typeof getForkLifecycleAtBuild>["state"],
) => state === "migration-open" || state === "migration-open-resolved";

export const isMigrationClosed = (
	state: ReturnType<typeof getForkLifecycleAtBuild>["state"],
) => state === "migration-closed-resolved" || state === "migration-closed-unverified";

export const isVerifiedForkResolution = (
	state: ReturnType<typeof getForkLifecycleAtBuild>["state"],
) => state === "migration-closed-resolved";
