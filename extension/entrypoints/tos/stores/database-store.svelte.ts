import { writable } from "svelte/store";
import { type DatabaseSettings, initializeDatabase, storageListeners } from "@/utils/common/data/database";
import { ttStorage } from "@/utils/common/data/storage";

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
