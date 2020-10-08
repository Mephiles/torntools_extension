let settings, filters;
let storageListeners = {
	settings: [],
	filters: [],
};

async function loadDatabase() {
	if (settings) return Promise.resolve();

	const database = await ttStorage.get();

	settings = database.settings;
	filters = database.filters;

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
		}
	}
});
