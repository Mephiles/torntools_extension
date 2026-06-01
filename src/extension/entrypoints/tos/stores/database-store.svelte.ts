import { ttStorage } from "@utils/context";
import { type DatabaseSettings, storageListeners } from "@utils/data/database";
import { writable } from "svelte/store";
import { initializeDatabase } from "@/context/extension-storage";

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
