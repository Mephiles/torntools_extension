import { api, type Database, type DatabaseKey, type RecursivePartial, type Writable } from "@/utils/common/data/database";
import { DEFAULT_STORAGE, getDefaultStorage } from "@/utils/common/data/default-database";

export abstract class TornToolsStorage {
	abstract get(): Promise<Database>;
	abstract get<K extends DatabaseKey>(key: K): Promise<Database[K]>;
	abstract get<K extends readonly DatabaseKey[]>(keys: K): Promise<{ [I in keyof K]: K[I] extends DatabaseKey ? Database[K[I]] : never }>;

	abstract set(object: { [key: string]: any }): Promise<void>;

	abstract remove(key: string | string[]): Promise<void>;

	abstract clear(): Promise<void>;

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
				const value = toChange[key];
				parent[key] = Array.isArray(value) ? Array.from(value) : value;
			} else {
				parent = { [key]: toChange[key] };
			}
		}
		return parent;
	}

	abstract reset(): Promise<void>;
	abstract reset(key: "attackHistory" | "stakeouts"): Promise<void>;

	abstract getSize(): Promise<number>;
}

export class TTExtensionStorage extends TornToolsStorage {
	get(): Promise<Database>;
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
		});
	}

	async getSize() {
		let size: number;

		if (browser.storage.local.getBytesInUse) size = await browser.storage.local.getBytesInUse();
		else size = JSON.stringify(await this.get(null)).length;

		return size;
	}
}

export { ttStorage } from "@/utils/context";
