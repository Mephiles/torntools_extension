import {
	type DatabaseApi,
	type DatabaseFactionStakeouts,
	type DatabaseLocaldata,
	type DatabaseNotificationHistory,
	type DatabaseSettings,
	type DatabaseStakeouts,
	type DatabaseStockdata,
	type DatabaseTorndata,
	type DatabaseUserdata,
	initializeDatabase,
	storageListeners,
} from "@common/utils/data/database";
import { ttStorage } from "@common/utils/data/storage";
import { writable } from "svelte/store";

let storesInitialized = $state(false);
export const settingsStore = writable<DatabaseSettings>();
export const apiStore = writable<DatabaseApi>();
export const userdataStore = writable<DatabaseUserdata>();
export const torndataStore = writable<DatabaseTorndata>();
export const stockdataStore = writable<DatabaseStockdata>();
export const stakeoutsStore = writable<DatabaseStakeouts>();
export const factionStakeoutsStore = writable<DatabaseFactionStakeouts>();
export const localdataStore = writable<DatabaseLocaldata>();
export const notificationHistoryStore = writable<DatabaseNotificationHistory>();

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
	storageListeners.notificationHistory.push((_oldNotificationHistory, newNotificationHistory) => notificationHistoryStore.set(newNotificationHistory));
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
