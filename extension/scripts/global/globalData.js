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
			const apiKey = await this.get("api_key");

			await this.clear();
			await this.set(DEFAULT_STORAGE);
			await this.set({ api_key: apiKey });

			console.log("Storage cleared");
			console.log("New storage", await this.get());

			resolve();
		});
	}
})();

const DEFAULT_STORAGE = {
	settings: {
		updateNotice: true,
		developer: true,
		pages: {
			global: {
				alignLeft: true,
				hideLevelUpgrade: true,
				hideQuitButtons: true,
				miniProfileLastAction: true,
				nukeRevive: true,
			},
			chat: {
				fontSize: 14,
				searchChat: true,
				blockZalgo: true,
			},
		},
	},
	filters: {
		preferences: {
			showAdvanced: false,
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
