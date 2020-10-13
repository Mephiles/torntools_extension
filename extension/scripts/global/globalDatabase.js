let settings, filters, version;
let databaseLoaded = false;
let storageListeners = {
	settings: [],
	filters: [],
	version: [],
};

async function loadDatabase() {
	if (databaseLoaded) return Promise.resolve();

	const database = await ttStorage.get();

	settings = database.settings;
	filters = database.filters;
	version = database.version;

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
		}
	}
});
