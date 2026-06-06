import { ttStorage } from "@common/utils/context";
import { type DatabaseAttackHistory, type DatabaseSettings, type DatabaseStakeouts, initializeDatabase, storageListeners } from "@common/utils/data/database";
import { writable } from "svelte/store";

let storesInitialized = $state(false);
export const settingsStore = writable<DatabaseSettings>();
export const attackHistoryStore = writable<DatabaseAttackHistory>();
export const stakeoutsStore = writable<DatabaseStakeouts>();

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
