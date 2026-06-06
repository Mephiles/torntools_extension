import { api, type Database, type DatabaseKey } from "@common/utils/data/database";
import { DEFAULT_STORAGE, getDefaultStorage } from "@common/utils/data/default-database";
import { TornToolsStorage } from "@common/utils/data/storage";

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
