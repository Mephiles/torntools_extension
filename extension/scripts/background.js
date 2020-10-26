(async () => {
	await convertDatabase();
	await loadDatabase();

	await checkUpdate();

	registerUpdaters();
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
					let useCurrent = true;

					if (defaultStorage[key].type === "array") {
						if (!Array.isArray(oldStorage[key])) {
							useDefault();
							useCurrent = false;
						}
					} else if (defaultStorage[key].type !== typeof oldStorage[key]) {
						useDefault();
						useCurrent = false;
					}

					if (useCurrent) newStorage[key] = oldStorage[key];
				} else {
					newStorage[key] = convertGeneral(oldStorage[key], defaultStorage[key]);
				}
			}

			function useDefault() {
				if (!defaultStorage[key].hasOwnProperty("defaultValue")) return;

				switch (typeof defaultStorage[key].defaultValue) {
					case "function":
						newStorage[key] = defaultStorage[key].defaultValue();
						break;
					case "boolean":
						newStorage[key] = defaultStorage[key].defaultValue;
						break;
					default:
						newStorage[key] = defaultStorage[key].defaultValue;
						break;
				}
			}
		}

		return newStorage;
	}
}

async function checkUpdate() {
	const oldVersion = version.oldVersion;
	const newVersion = chrome.runtime.getManifest().version;

	const change = { version: { oldVersion: newVersion } };
	if (oldVersion !== newVersion) {
		console.log("New version detected!", newVersion);
		change.version.showNotice = true;
	}

	await ttStorage.change(change);
}

function registerUpdaters() {
	timedUpdates();

	setInterval(timedUpdates, 30 * TO_MILLIS.SECONDS);
}

function timedUpdates() {
	// TODO - Update essential userdata.
	// TODO - Update basic userdata.
	// TODO - Update npc times.
	// TODO - Update networth data.
	// TODO - Update stocks data.
	// TODO - Update OC data.

	if (!torndata || !isSameUTCDay(new Date(torndata.date), new Date())) {
		updateTorndata()
			.then(() => console.log("Updated torndata."))
			.catch((error) => console.error("Error while updating torndata.", error));
	}
}

/*
 * Update on new torn day.
 */
async function updateTorndata() {
	if (!api.torn.key) return;

	let newTorndata = await fetchApi("torn", { section: "torn", selections: ["education", "honors", "items", "medals", "pawnshop"] });
	newTorndata.date = new Date().getTime();
	if (torndata) newTorndata.stocks = torndata.stocks;

	await ttStorage.set({ torndata: newTorndata });
}
