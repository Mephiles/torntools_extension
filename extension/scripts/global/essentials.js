console.log("TT2 - Loading essential data.");

/*
 * Classes.
 */

class TTStorage {
	get(key) {
		return new Promise(resolve => {
			if (Array.isArray(key)) {
				chrome.storage.local.get(key, data => resolve(key.map(i => data[i])));
			} else if (key) {
				chrome.storage.local.get([key], data => resolve(data[key]));
			} else {
				chrome.storage.local.get(null, data => resolve(data));
			}
		});
	}

	set(object) {
		return new Promise(resolve => {
			chrome.storage.local.set(object, function () {
				resolve();
			});
		});
	}

	clear() {
		return new Promise(resolve => {
			chrome.storage.local.clear(function () {
				resolve();
			});
		});
	}

	change(object) {
		return new Promise(async resolve => {
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
		return new Promise(async resolve => {
			const apiKey = await this.get("api_key");

			await this.clear();
			await this.set(DEFAULT_STORAGE);
			await this.set("api_key", apiKey);

			console.log("Storage cleared");
			console.log("New storage", await this.get());

			resolve();
		});
	}
}

const ttStorage = new TTStorage();