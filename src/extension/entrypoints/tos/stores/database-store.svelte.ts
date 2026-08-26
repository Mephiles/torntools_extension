import { ttStorage } from "@common/utils/context";
import { initializeDatabase, storageListeners } from "@common/utils/data/database";
import type { DatabaseSettings } from "@common/utils/data/database";
import { writable } from "svelte/store";

let storesInitialized = $state(false);
export const settingsStore = writable<DatabaseSettings>();

export function initializeDatabaseStore() {
	if (storesInitialized) return;

	loadDatabaseStores().then(() => (storesInitialized = true));

	storageListeners.settings.push((_oldSettings, newSettings) => {
		settingsStore.set(newSettings);
	});
}

async function loadDatabaseStores() {
	await initializeDatabase();

	const [settings] = await ttStorage.get(["settings", "attackHistory", "stakeouts"] as const);

	settingsStore.set(settings);
}
