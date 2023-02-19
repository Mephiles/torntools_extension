"use strict";

let settings, filters, version, api, userdata, torndata, stakeouts, attackHistory, notes, factiondata, quick, localdata, npcs, notificationHistory, stockdata, factionStakeouts;
let databaseLoaded = false;
let databaseLoading = false;
const storageListeners = {
	settings: [],
	filters: [],
	version: [],
	userdata: [],
	stakeouts: [],
	factionStakeouts: [],
	notes: [],
	factiondata: [],
	localdata: [],
	cache: [],
	api: [],
	npcs: [],
};

async function loadDatabase() {
	if (databaseLoaded) return Promise.resolve();
	else if ((databaseLoaded && !settings) || databaseLoading) {
		await sleep(75);
		return await loadDatabase();
	}

	databaseLoading = true;

	const database = await ttStorage.get();

	settings = database.settings;
	filters = database.filters;
	version = database.version;
	api = database.api;
	userdata = database.userdata;
	torndata = database.torndata;
	localdata = database.localdata;
	stakeouts = database.stakeouts;
	attackHistory = database.attackHistory;
	notes = database.notes;
	factiondata = database.factiondata;
	quick = database.quick;
	ttCache.cache = database.cache;
	ttUsage.usage = database.usage;
	npcs = database.npcs;
	stockdata = database.stockdata;
	factionStakeouts = database.factionStakeouts;

	console.log("TT - Database loaded.", database);
	databaseLoaded = true;
	return database;
}

chrome.storage.onChanged.addListener((changes, area) => {
	if (area === "local") {
		for (const key in changes) {
			switch (key) {
				case "settings":
					settings = changes.settings.newValue;
					break;
				case "filters":
					filters = changes.filters.newValue;
					break;
				case "version":
					version = changes.version.newValue;
					break;
				case "userdata":
					userdata = changes.userdata.newValue;
					break;
				case "api":
					api = changes.api.newValue;
					break;
				case "torndata":
					torndata = changes.torndata.newValue;
					break;
				case "stakeouts":
					stakeouts = changes.stakeouts.newValue;
					break;
				case "attackHistory":
					attackHistory = changes.attackHistory.newValue;
					break;
				case "notes":
					notes = changes.notes.newValue;
					break;
				case "factiondata":
					factiondata = changes.factiondata.newValue;
					break;
				case "quick":
					quick = changes.quick.newValue;
					break;
				case "localdata":
					localdata = changes.localdata.newValue;
					break;
				case "cache":
					ttCache.cache = changes.cache.newValue;
					break;
				case "usage":
					ttUsage.usage = changes.usage.newValue;
					break;
				case "npcs":
					npcs = changes.npcs.newValue;
					break;
				case "stockdata":
					stockdata = changes.stockdata.newValue;
					break;
				case "notificationHistory":
					if (typeof notificationHistory !== "undefined") notificationHistory = changes.notificationHistory.newValue;
					break;
				case "factionStakeouts":
					factionStakeouts = changes.factionStakeouts.newValue;
					break;
			}
			if (storageListeners[key]) storageListeners[key].forEach((listener) => listener(changes[key].oldValue));
		}
	}
});
