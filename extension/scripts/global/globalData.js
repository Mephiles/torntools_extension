// noinspection JSUnresolvedVariable
chrome = typeof browser !== "undefined" ? browser : chrome;

const ttStorage = new (class {
	get(key) {
		return new Promise((resolve) => {
			if (Array.isArray(key)) {
				chrome.storage.local.get(key, (data) => resolve(key.map((i) => data[i])));
			} else if (key) {
				chrome.storage.local.get([key], (data) => resolve(data[key]));
			} else {
				chrome.storage.local.get(null, (data) => resolve(data));
			}
		});
	}

	set(object) {
		return new Promise((resolve) => {
			chrome.storage.local.set(object, function () {
				resolve();
			});
		});
	}

	clear() {
		return new Promise((resolve) => {
			chrome.storage.local.clear(function () {
				resolve();
			});
		});
	}

	change(object) {
		return new Promise(async (resolve) => {
			for (let key of Object.keys(object)) {
				const data = recursive(await this.get(key), object[key]);

				function recursive(parent, toChange) {
					for (let key in toChange) {
						if (parent && key in parent && typeof toChange[key] === "object" && !Array.isArray(toChange[key])) {
							parent[key] = recursive(parent[key], toChange[key]);
						} else if (parent) {
							parent[key] = toChange[key];
						} else {
							parent = { [key]: toChange[key] };
						}
					}
					return parent;
				}

				await this.set({ [key]: data });
			}
			resolve();
		});
	}

	reset() {
		return new Promise(async (resolve) => {
			// TODO - Add API key again.
			// const apiKey = await this.get("api_key");

			await this.clear();
			await this.set(getDefaultStorage(DEFAULT_STORAGE));
			// await this.set({ api_key: apiKey });

			console.log("Storage cleared");
			console.log("New storage", await this.get());

			resolve();

			function getDefaultStorage(defaultStorage) {
				let newStorage = {};

				for (let key in defaultStorage) {
					newStorage[key] = {};

					if (typeof defaultStorage[key] === "object") {
						if (defaultStorage[key] instanceof DefaultSetting) {
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
						} else {
							newStorage[key] = getDefaultStorage(defaultStorage[key]);
						}
					}
				}

				return newStorage;
			}
		});
	}
})();

const DEFAULT_STORAGE = {
	version: {
		oldVersion: new DefaultSetting({ type: "string" }),
		showNotice: new DefaultSetting({ type: "boolean", defaultValue: true }),
	},
	api: {
		torn: {
			key: new DefaultSetting({ type: "string" }),
			online: new DefaultSetting({ type: "boolean", defaultValue: true }),
			error: new DefaultSetting({ type: "string" }),
		},
	},
	settings: {
		updateNotice: new DefaultSetting({ type: "boolean", defaultValue: true }),
		developer: new DefaultSetting({ type: "boolean", defaultValue: false }),
		pages: {
			global: {
				alignLeft: new DefaultSetting({ type: "boolean", defaultValue: false }),
				hideLevelUpgrade: new DefaultSetting({ type: "boolean", defaultValue: false }),
				hideQuitButtons: new DefaultSetting({ type: "boolean", defaultValue: false }),
				miniProfileLastAction: new DefaultSetting({ type: "boolean", defaultValue: true }),
				nukeRevive: new DefaultSetting({ type: "boolean", defaultValue: false }),
			},
			chat: {
				fontSize: new DefaultSetting({ type: "number", defaultValue: 12 }),
				searchChat: new DefaultSetting({ type: "boolean", defaultValue: true }),
				blockZalgo: new DefaultSetting({ type: "boolean", defaultValue: true }),
				highlights: new DefaultSetting({ type: "array", defaultValue: () => [{ name: "$player", color: "#7ca900" }] }),
			},
		},
	},
	filters: {
		preferences: {
			showAdvanced: new DefaultSetting({ type: "boolean", defaultValue: false }),
		},
	},
};

const CONTRIBUTORS = {
	Mephiles: {
		id: 2087524,
		name: "Mephiles",
	},
	DKK: {
		id: 2114440,
		name: "DeKleineKobini",
	},
	wootty2000: {
		id: 2344687,
		name: "wootty2000",
	},
	finally: {
		id: 2060206,
		name: "finally",
	},
};

let mobile;

const HIGHLIGHT_PLACEHOLDERS = [{ name: "$player", value: () => "DeKleineKobini", description: "Your player name." }]; // TODO

const TO_MILLIS = {
	SECONDS: 1000,
	MINUTES: 1000 * 60,
	HOURS: 1000 * 60 * 60,
	DAYS: 1000 * 60 * 60 * 24,
};
