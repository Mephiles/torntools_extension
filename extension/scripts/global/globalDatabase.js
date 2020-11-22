let settings, filters, version, api, userdata, torndata, stakeouts, attackHistory;
let databaseLoaded = false;
let storageListeners = {
	settings: [],
	filters: [],
	version: [],
	userdata: [],
	stakeouts: [],
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

	databaseLoaded = true;
	console.log("TT - Database loaded.", database);
}

// noinspection JSDeprecatedSymbols
chrome.storage.onChanged.addListener((changes, area) => {
	if (area === "local") {
		if (changes.settings) {
			settings = changes.settings.newValue;

			storageListeners.settings.forEach((listener) => listener());
		} else if (changes.filters) {
			filters = changes.filters.newValue;

			storageListeners.filters.forEach((listener) => listener());
		} else if (changes.version) {
			version = changes.version.newValue;

			storageListeners.version.forEach((listener) => listener());
		} else if (changes.userdata) {
			userdata = changes.userdata.newValue;

			storageListeners.userdata.forEach((listener) => listener());
		} else if (changes.api) {
			api = changes.api.newValue;
		} else if (changes.torndata) {
			torndata = changes.torndata.newValue;
		} else if (changes.stakeouts) {
			stakeouts = changes.stakeouts.newValue;

			storageListeners.stakeouts.forEach((listener) => listener());
		}
	}
});
