import { ttStorage } from "@common/utils/context";
import {
	type DatabaseAttackHistory,
	type DatabaseFactionStakeouts,
	type DatabaseSettings,
	type DatabaseStakeouts,
	initializeDatabase,
	storageListeners,
} from "@common/utils/data/database";
import { writable } from "svelte/store";

let storesInitialized = $state(false);
export const settingsStore = writable<DatabaseSettings>();
export const attackHistoryStore = writable<DatabaseAttackHistory>();
export const stakeoutsStore = writable<DatabaseStakeouts>();
export const factionStakeoutsStore = writable<DatabaseFactionStakeouts>();

export function initializeDatabaseStore() {
	if (storesInitialized) {
		return;
	}

	void initializeDatabase();
	loadDatabaseStores().then(() => {
		storesInitialized = true;
	});

	storageListeners.settings.push((_oldData, newData) => {
		settingsStore.set(newData);
	});
	storageListeners.attackHistory.push((_oldData, newData) => {
		attackHistoryStore.set(newData);
	});
	storageListeners.stakeouts.push((_oldData, newData) => {
		stakeoutsStore.set(newData);
	});
	storageListeners.factionStakeouts.push((_oldData, newData) => {
		factionStakeoutsStore.set(newData);
	});
}

export async function loadDatabaseStores() {
	const [settings, attackHistory, stakeouts, factionStakeouts] = await ttStorage.get(["settings", "attackHistory", "stakeouts", "factionStakeouts"] as const);

	settingsStore.set(settings);
	attackHistoryStore.set(attackHistory);
	stakeoutsStore.set(stakeouts);
	factionStakeoutsStore.set(factionStakeouts);
}
