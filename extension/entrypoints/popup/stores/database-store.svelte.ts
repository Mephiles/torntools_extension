import { writable } from "svelte/store";
import { type Database, type DatabaseSettings, initializeDatabase, storageListeners } from "@/utils/common/data/database";
import { ttStorage } from "@/utils/common/data/storage";

let storesInitialized = $state(false);
export const settingsStore = writable<DatabaseSettings>();
export const apiStore = writable<Database["api"]>();
export const userdataStore = writable<Database["userdata"]>();
export const torndataStore = writable<Database["torndata"]>();
export const stockdataStore = writable<Database["stockdata"]>();
export const stakeoutsStore = writable<Database["stakeouts"]>();
export const factionStakeoutsStore = writable<Database["factionStakeouts"]>();
export const localdataStore = writable<Database["localdata"]>();
export const notificationHistoryStore = writable<Database["notificationHistory"]>();

export function initializeDatabaseStore() {
	if (storesInitialized) return;

	void initializeDatabase();
	loadDatabaseStores().then(() => {
		storesInitialized = true;
	});

	storageListeners.settings.push((_oldSettings, newSettings) => settingsStore.set(newSettings));
	storageListeners.api.push((_oldApi, newApi) => apiStore.set(newApi));
	storageListeners.userdata.push((_oldUserdata, newUserdata) => userdataStore.set(newUserdata));
	storageListeners.torndata.push((_oldTorndata, newTorndata) => torndataStore.set(newTorndata));
	storageListeners.stockdata.push((_oldStockdata, newStockdata) => stockdataStore.set(newStockdata));
	storageListeners.stakeouts.push((_oldStakeouts, newStakeouts) => stakeoutsStore.set(newStakeouts));
	storageListeners.factionStakeouts.push((_oldStakeouts, newStakeouts) => factionStakeoutsStore.set(newStakeouts));
	storageListeners.localdata.push((_oldLocaldata, newLocaldata) => localdataStore.set(newLocaldata));
}

export async function loadDatabaseStores() {
	const [settings, api, userdata, torndata, stockdata, stakeouts, factionStakeouts, localdata, notificationHistory] = await ttStorage.get([
		"settings",
		"api",
		"userdata",
		"torndata",
		"stockdata",
		"stakeouts",
		"factionStakeouts",
		"localdata",
		"notificationHistory",
	] as const);

	settingsStore.set(settings);
	apiStore.set(api);
	userdataStore.set(userdata);
	torndataStore.set(torndata);
	stockdataStore.set(stockdata);
	stakeoutsStore.set(stakeouts);
	factionStakeoutsStore.set(factionStakeouts);
	localdataStore.set(localdata);
	notificationHistoryStore.set(notificationHistory);
}
