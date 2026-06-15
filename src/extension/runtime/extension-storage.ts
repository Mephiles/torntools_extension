import { api, type Database, type DatabaseKey } from "@common/utils/data/database";
import { DEFAULT_STORAGE, getDefaultStorage } from "@common/utils/data/default-database";
import { TornToolsStorage } from "@common/utils/data/storage";

export class TTExtensionStorage extends TornToolsStorage {
	get(): Promise<Database>;
	get<K extends DatabaseKey>(key: K): Promise<Database[K]>;
	get<K extends readonly DatabaseKey[]>(keys: K): Promise<{ [I in keyof K]: K[I] extends DatabaseKey ? Database[K[I]] : never }>;
	async get(key?: DatabaseKey | DatabaseKey[]) {
		if (Array.isArray(key)) {
			const data = await browser.storage.local.get(key);

			return key.map((i) => data[i]);
		} else if (key) {
			return (await browser.storage.local.get([key]))[key];
		} else {
			return browser.storage.local.get(null);
		}
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

	async reset(key?: "attackHistory" | "stakeouts" | "factionStakeouts"): Promise<void> {
		if (["attackHistory", "stakeouts", "factionStakeouts"].includes(key)) {
			await this.set({ [key]: getDefaultStorage(DEFAULT_STORAGE)[key] });
		} else {
			const apiKey = api ? api.torn.key : undefined;

			await this.clear();
			await this.set(getDefaultStorage(DEFAULT_STORAGE));
			await this.change({ api: { torn: { key: apiKey } } });

			console.log("Storage cleared");
			console.log("New storage", await this.get());
		}
	}

	async getSize() {
		let size: number;

		if (browser.storage.local.getBytesInUse) size = await browser.storage.local.getBytesInUse();
		else size = JSON.stringify(await this.get(null)).length;

		return size;
	}
}
