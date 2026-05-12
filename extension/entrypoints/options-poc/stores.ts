import { writable } from "svelte/store";
import { api, factiondata, initializeDatabase, loadDatabase, npcs, settings, stockdata, torndata, userdata } from "@/utils/common/data/database";
import { ttStorage } from "@/utils/common/data/storage";

// Global stores that sync with the existing database module
export const settingsStore = writable(settings);
export const apiStore = writable(api);
export const userdataStore = writable(userdata);
export const torndataStore = writable(torndata);
export const stockdataStore = writable(stockdata);
export const factiondataStore = writable(factiondata);
export const npcsStore = writable(npcs);

async function syncOptionStores() {
	const nextSettings = await ttStorage.get("settings");
	const nextApi = await ttStorage.get("api");
	const nextUserdata = await ttStorage.get("userdata");
	const nextTorndata = await ttStorage.get("torndata");
	const nextStockdata = await ttStorage.get("stockdata");
	const nextFactiondata = await ttStorage.get("factiondata");
	const nextNpcs = await ttStorage.get("npcs");

	settingsStore.set(nextSettings);
	apiStore.set(nextApi);
	userdataStore.set(nextUserdata);
	torndataStore.set(nextTorndata);
	stockdataStore.set(nextStockdata);
	factiondataStore.set(nextFactiondata);
	npcsStore.set(nextNpcs);
}

// Helper to update settings using ttStorage.change
export function updateSettings(updates: Partial<typeof settings>) {
	return ttStorage.change({ settings: updates }).then(() => {
		settingsStore.update((current) => ({ ...current, ...updates }));
	});
}

// Initialize database
export async function initializeOptionsDatabase() {
	initializeDatabase();
	await loadDatabase();

	await syncOptionStores();
}

export async function reloadOptionsStores() {
	await syncOptionStores();
}
