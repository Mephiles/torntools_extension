"use strict";

let settings, filters, version, api, userdata, torndata, stakeouts, attackHistory, notes;
let databaseLoaded = false;
let storageListeners = {
	settings: [],
	filters: [],
	version: [],
	userdata: [],
	stakeouts: [],
	notes: [],
};

async function loadDatabase() {
	if (databaseLoaded) return Promise.resolve();

	const database = await ttStorage.get();

	settings = database.settings;
	filters = database.filters;
	version = database.version;
	api = database.api;
	userdata = database.userdata;
	torndata = database.torndata;
	stakeouts = database.stakeouts;
	attackHistory = database.attackHistory;
	notes = database.notes;

	databaseLoaded = true;
	console.log("TT - Database loaded.", database);
}

// noinspection JSDeprecatedSymbols
chrome.storage.onChanged.addListener((changes, area) => {
	if (area === "local") {
		if (changes.settings) {
			console.log("Settings", changes);
			settings = changes.settings.newValue;

			storageListeners.settings.forEach((listener) => listener(changes.settings.oldValue));
		} else if (changes.filters) {
			filters = changes.filters.newValue;

			storageListeners.filters.forEach((listener) => listener(changes.filters.oldValue));
		} else if (changes.version) {
			version = changes.version.newValue;

			storageListeners.version.forEach((listener) => listener(changes.version.oldValue));
		} else if (changes.userdata) {
			userdata = changes.userdata.newValue;

			storageListeners.userdata.forEach((listener) => listener(changes.userdata.oldValue));
		} else if (changes.api) {
			api = changes.api.newValue;
		} else if (changes.torndata) {
			torndata = changes.torndata.newValue;
		} else if (changes.stakeouts) {
			stakeouts = changes.stakeouts.newValue;

			storageListeners.stakeouts.forEach((listener) => listener(changes.stakeouts.oldValue));
		} else if (changes.attackHistory) {
			attackHistory = changes.attackHistory.newValue;
		} else if (changes.notes) {
			notes = changes.notes.newValue;

			storageListeners.notes.forEach((listener) => listener(changes.notes.oldValue));
		}
	}
});
