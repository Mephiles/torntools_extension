import { ttStorage } from "@utils/context";
import {
	type DatabaseApi,
	type DatabaseFactiondata,
	type DatabaseNpcs,
	type DatabaseSettings,
	type DatabaseStockdata,
	type DatabaseTorndata,
	type DatabaseUserdata,
	storageListeners,
} from "@utils/data/database";
import { writable } from "svelte/store";
import { registerExtensionContext } from "@/context/extension-context";
import { initializeDatabase } from "@/context/extension-storage";

let storesInitialized = $state(false);
export const settingsStore = writable<DatabaseSettings>();
export const apiStore = writable<DatabaseApi>();
export const userdataStore = writable<DatabaseUserdata>();
export const torndataStore = writable<DatabaseTorndata>();
export const stockdataStore = writable<DatabaseStockdata>();
export const factiondataStore = writable<DatabaseFactiondata>();
export const npcsStore = writable<DatabaseNpcs>();

export function initializeDatabaseStore() {
	if (storesInitialized) {
		return;
	}

	registerExtensionContext();
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
