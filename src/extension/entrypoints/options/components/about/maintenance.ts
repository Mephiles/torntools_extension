import { loadDatabase, migrateDatabase } from "@common/utils/data/database.ts";
import { toast } from "svelte-sonner";
import { BACKGROUND_SERVICE } from "@/services/proxy-services";

export type ForceTarget = "userdata" | "torndata" | "stocks" | "factiondata";
export type ClearAction = `clear-${ForceTarget}`;
export type MaintenanceAction = ForceTarget | ClearAction | "reinitialize-timers" | "clear-cache";

const forceTargets: ForceTarget[] = ["userdata", "torndata", "stocks", "factiondata"];
const clearActions: ClearAction[] = ["clear-userdata", "clear-torndata", "clear-stocks", "clear-factiondata"];

function isForceTarget(action: MaintenanceAction): action is ForceTarget {
	return forceTargets.includes(action as any);
}

function isClearAction(action: MaintenanceAction): action is ClearAction {
	return clearActions.includes(action as any);
}

export async function runMaintenanceAction(action: MaintenanceAction) {
	try {
		if (action === "reinitialize-timers") {
			await BACKGROUND_SERVICE.reinitializeTimers();
			toast.success("Reset background timers.");
		} else if (action === "clear-cache") {
			await BACKGROUND_SERVICE.clearCache();
			toast.success("Cleared cache.");
		} else if (isForceTarget(action)) {
			const result = await BACKGROUND_SERVICE.forceUpdate(action);
			if (!result.success) {
				toast.error("message" in result ? result.message : getActionError(result.error, `Failed to fetch ${action}.`));
			} else {
				await loadDatabase(true);
				toast.success(`Fetched ${action}.`);
			}
		} else if (isClearAction(action)) {
			const section = action.replace("clear-", "");
			const result = await BACKGROUND_SERVICE.removeDatabaseSection(section);
			if (!result.success) {
				toast.error("message" in result ? result.message : getActionError(result.error, `Failed to clear ${section}.`));
			} else {
				await migrateDatabase(true);
				toast.success(`Cleared ${section}.`);
			}
		}
	} catch (error) {
		toast.error(error instanceof Error ? error.message : "Action failed.");
	}
}

function getActionError(error: unknown, fallback: string) {
	if (error instanceof Error && error.message) return error.message;
	return fallback;
}
