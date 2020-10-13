(async () => {
	await convertDatabase();
	await loadDatabase();

	await checkUpdate();
})();

async function convertDatabase() {
	let storage = await ttStorage.get();

	if (!storage || !Object.keys(storage).length) {
		console.log("Setting new storage.");
		await ttStorage.set(DEFAULT_STORAGE);
	} else {
		console.log("Old storage.", storage);

		let newStorage = convertGeneral(storage, DEFAULT_STORAGE);

		await ttStorage.clear();
		await ttStorage.set(newStorage);

		console.log("New storage.", newStorage);
	}

	function convertGeneral(oldStorage, defaultStorage) {
		let newStorage = {};

		for (let key in defaultStorage) {
			if (
				!(key in oldStorage) || // key is not in old storage
				(typeof defaultStorage[key] !== "undefined" && typeof defaultStorage[key] !== typeof oldStorage[key])
			) {
				// key has a new type
				newStorage[key] = defaultStorage[key];
				continue;
			}

			if (typeof defaultStorage[key] === "object" && !Array.isArray(defaultStorage[key])) {
				if (!Object.keys(defaultStorage[key]).length) newStorage[key] = oldStorage[key];
				else newStorage[key] = convertGeneral(oldStorage[key], defaultStorage[key]);
			} else {
				newStorage[key] = oldStorage[key];
			}
		}

		return newStorage;
	}
}

async function checkUpdate() {
	const oldVersion = settings.previousVersion;
	const newVersion = chrome.runtime.getManifest().version;

	await ttStorage.change({
		version: {
			showNotice: !oldVersion || oldVersion !== newVersion,
			oldVersion: newVersion,
		},
	});
}
