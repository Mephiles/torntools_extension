import { BACKGROUND_SERVICE } from "@common/utils/services/proxy-services";
import { loadDatabaseStores } from "@extension/entrypoints/options/stores/database-store.svelte";
import { toast } from "svelte-sonner";

export type ForceTarget = "userdata" | "torndata" | "stocks" | "factiondata";
export type MaintenanceAction = ForceTarget | "reinitialize-timers" | "clear-cache";

export async function runMaintenanceAction(action: MaintenanceAction) {
	try {
		if (action === "reinitialize-timers") {
			await BACKGROUND_SERVICE.reinitializeTimers();
			toast.success("Reset background timers.");
		} else if (action === "clear-cache") {
			await BACKGROUND_SERVICE.clearCache();
			toast.success("Cleared cache.");
		} else {
			const result = await BACKGROUND_SERVICE.forceUpdate(action);
			if (result.success === false) {
				toast.error("message" in result ? result.message : getActionError(result.error, `Failed to fetch ${action}.`));
			} else {
				await loadDatabaseStores();
				toast.success(`Fetched ${action}.`);
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
