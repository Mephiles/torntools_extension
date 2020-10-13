(async () => {
	await convertDatabase();
	await loadDatabase();

	await checkUpdate();
})();

async function convertDatabase() {
	let storage = await ttStorage.get();

	if (!storage || !Object.keys(storage).length) {
		console.log("Setting new storage.");
		await ttStorage.reset();
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
			if (!oldStorage) oldStorage = {};
			if (!key in oldStorage) oldStorage[key] = {};

			if (typeof defaultStorage[key] === "object") {
				if (defaultStorage[key] instanceof DefaultSetting) {
					if (defaultStorage[key].type !== typeof oldStorage[key]) {
						if (defaultStorage[key].hasOwnProperty("defaultValue")) {
							switch (typeof defaultStorage[key].defaultValue) {
								case "function":
									console.log("DKK default", key, "function", defaultStorage[key].defaultValue());
									newStorage[key] = defaultStorage[key].defaultValue();
									break;
								case "boolean":
									console.log("DKK default", key, "boolean", defaultStorage[key].defaultValue);
									newStorage[key] = defaultStorage[key].defaultValue;
									break;
								default:
									console.log("DKK default", key, `other (${typeof defaultStorage[key].defaultValue})`, defaultStorage[key].defaultValue);
									newStorage[key] = defaultStorage[key].defaultValue;
									break;
							}
						}
					} else {
						console.log("DKK default 2", key);
						newStorage[key] = oldStorage[key];
					}
				} else {
					console.log("DKK default 3", key);
					newStorage[key] = convertGeneral(oldStorage[key], defaultStorage[key]);
				}
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
