let settings;
let storageListeners = {
	settings: [],
};

async function loadDatabase() {
	if (settings) return Promise.resolve();

	const database = await ttStorage.get();

	settings = database.settings;

	console.log("TT - Database loaded.", database);
}

// noinspection JSDeprecatedSymbols
chrome.storage.onChanged.addListener((changes, area) => {
	if (area === "local") {
		if (changes.settings) {
			settings = changes.settings.newValue;

			storageListeners.settings.forEach(listener => listener());
		}
	}
});