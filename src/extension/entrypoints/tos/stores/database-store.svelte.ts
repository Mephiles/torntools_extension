import { ttStorage } from "@common/utils/context";
import { type DatabaseSettings, initializeDatabase, storageListeners } from "@common/utils/data/database";
import { writable } from "svelte/store";

let storesInitialized = $state(false);
export const settingsStore = writable<DatabaseSettings>();

export function initializeDatabaseStore() {
	if (storesInitialized) {
		return;
	}

	void initializeDatabase();
	loadDatabaseStores().then(() => {
		storesInitialized = true;
	});

	storageListeners.settings.push((_oldSettings, newSettings) => {
		settingsStore.set(newSettings);
	});
}

export async function loadDatabaseStores() {
	const [settings] = await ttStorage.get(["settings", "attackHistory", "stakeouts"] as const);

	settingsStore.set(settings);
}
