import { api, type Database, type DatabaseKey, type RecursivePartial, type Writable } from "@/utils/common/data/database";
import { DEFAULT_STORAGE, DefaultSetting } from "@/utils/common/data/default-database";

class TornToolsStorage {
	get(): Promise<any>;
	get<K extends DatabaseKey>(key: K): Promise<Database[K]>;
	get<K extends readonly DatabaseKey[]>(keys: K): Promise<{ [I in keyof K]: K[I] extends DatabaseKey ? Database[K[I]] : never }>;
	get(key?: DatabaseKey | DatabaseKey[]) {
		return new Promise(async (resolve) => {
			if (Array.isArray(key)) {
				const data = await browser.storage.local.get(key);

				resolve(key.map((i) => data[i]));
			} else if (key) {
				const data = await browser.storage.local.get([key]);

				resolve(data[key]);
			} else {
				const data = await browser.storage.local.get(null);

				resolve(data);
			}
		});
	}

	set(object: { [key: string]: any }) {
		return browser.storage.local.set(object);
	}

	remove(key: string | string[]) {
		return browser.storage.local.remove(Array.isArray(key) ? key : [key]);
	}

	clear() {
		return browser.storage.local.clear();
	}

	change(object: RecursivePartial<Writable<Database>>): Promise<void> {
		return new Promise(async (resolve) => {
			const keys = Object.keys(object) as DatabaseKey[];
			for (const key of keys) {
				const data = this.recursive(await this.get(key), object[key]);

				await this.set({ [key]: data });
			}
			resolve();
		});
	}

	private recursive(parent: any, toChange: any) {
		for (const key in toChange) {
			if (
				parent &&
				typeof parent === "object" &&
				!Array.isArray(parent[key]) &&
				key in parent &&
				typeof toChange[key] === "object" &&
				!Array.isArray(toChange[key]) &&
				toChange[key] !== null
			) {
				parent[key] = this.recursive(parent[key], toChange[key]);
			} else if (parent && typeof parent === "object") {
				parent[key] = toChange[key];
			} else {
				parent = { [key]: toChange[key] };
			}
		}
		return parent;
	}

	reset(): Promise<void>;
	reset(key: "attackHistory" | "stakeouts"): Promise<void>;
	reset(key?: "attackHistory" | "stakeouts"): Promise<void> {
		return new Promise(async (resolve) => {
			if (["attackHistory", "stakeouts"].includes(key)) {
				await this.set({ [key]: getDefaultStorage(DEFAULT_STORAGE)[key] });

				resolve();
			} else {
				const apiKey = api ? api.torn.key : undefined;

				await this.clear();
				await this.set(getDefaultStorage(DEFAULT_STORAGE));
				await this.change({ api: { torn: { key: apiKey } } });

				console.log("Storage cleared");
				console.log("New storage", await this.get());

				resolve();
			}

			function getDefaultStorage(defaultStorage: { [key: string]: any }) {
				const newStorage: { [key: string]: any } = {};

				for (const key in defaultStorage) {
					if (typeof defaultStorage[key] === "object") {
						const setting = defaultStorage[key];
						if (setting instanceof DefaultSetting && "defaultValue" in setting) {
							switch (typeof setting.defaultValue) {
								case "function":
									newStorage[key] = setting.defaultValue();
									break;
								case "boolean":
								case "number":
								case "string":
								case "object":
									newStorage[key] = setting.defaultValue;
									break;
								default:
									newStorage[key] = setting.defaultValue;
									break;
							}
						} else {
							newStorage[key] = getDefaultStorage(defaultStorage[key]);
						}
					} else {
						newStorage[key] = defaultStorage[key];
					}
				}

				return newStorage;
			}
		});
	}

	async getSize() {
		let size: number;

		if (browser.storage.local.getBytesInUse) size = await browser.storage.local.getBytesInUse();
		else size = JSON.stringify(await this.get(null)).length;

		return size;
	}
}

export const ttStorage = new TornToolsStorage();
