import { writable } from "svelte/store";
import { type Database, type DatabaseSettings, initializeDatabase, storageListeners } from "@/utils/common/data/database";
import { ttStorage } from "@/utils/common/data/storage";

let storesInitialized = $state(false);
export const settingsStore = writable<DatabaseSettings>();
export const attackHistoryStore = writable<Database["attackHistory"]>();
export const stakeoutsStore = writable<Database["stakeouts"]>();

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
	storageListeners.attackHistory.push((_oldApi, newApi) => {
		attackHistoryStore.set(newApi);
	});
	storageListeners.stakeouts.push((_oldUserdata, newUserdata) => {
		stakeoutsStore.set(newUserdata);
	});
}

export async function loadDatabaseStores() {
	const [settings, attackHistory, stakeouts] = await ttStorage.get(["settings", "attackHistory", "stakeouts"] as const);

	settingsStore.set(settings);
	attackHistoryStore.set(attackHistory);
	stakeoutsStore.set(stakeouts);
}

export function isStoresInitialized() {
	return storesInitialized;
}
