import { writable } from "svelte/store";
import { type Database, type DatabaseSettings, initializeDatabase, storageListeners } from "@/utils/common/data/database";
import { ttStorage } from "@/utils/common/data/storage";

let storesInitialized = $state(false);
export const settingsStore = writable<DatabaseSettings>();
export const apiStore = writable<Database["api"]>();
export const userdataStore = writable<Database["userdata"]>();
export const torndataStore = writable<Database["torndata"]>();
export const stockdataStore = writable<Database["stockdata"]>();
export const factiondataStore = writable<Database["factiondata"]>();
export const npcsStore = writable<Database["npcs"]>();

export function initializeDatabaseStore() {
	if (storesInitialized) {
		return;
	}

	// storesInitialized = true;
	void initializeDatabase();
	loadDatabaseStores().then(() => {
		storesInitialized = true;
	});

	storageListeners.settings.push((_oldSettings, newSettings) => {
		settingsStore.set(newSettings);
	});
	storageListeners.api.push((_oldApi, newApi) => {
		apiStore.set(newApi);
	});
	storageListeners.userdata.push((_oldUserdata, newUserdata) => {
		userdataStore.set(newUserdata);
	});
	storageListeners.torndata.push((_oldTorndata, newTorndata) => {
		torndataStore.set(newTorndata);
	});
	storageListeners.stockdata.push((_oldStockdata, newStockdata) => {
		stockdataStore.set(newStockdata);
	});
	storageListeners.factiondata.push((_oldFactiondata, newFactiondata) => {
		factiondataStore.set(newFactiondata);
	});
	storageListeners.npcs.push((_oldNpcs, newNpcs) => {
		npcsStore.set(newNpcs);
	});
}

export async function loadDatabaseStores() {
	const [settings, api, userdata, torndata, stockdata, factiondata, npcs] = await ttStorage.get([
		"settings",
		"api",
		"userdata",
		"torndata",
		"stockdata",
		"factiondata",
		"npcs",
	] as const);

	settingsStore.set(settings);
	apiStore.set(api);
	userdataStore.set(userdata);
	torndataStore.set(torndata);
	stockdataStore.set(stockdata);
	factiondataStore.set(factiondata);
	npcsStore.set(npcs);
}

export function isStoresInitialized() {
	return storesInitialized;
}
