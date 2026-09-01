import type { CacheEntry, DatabaseCache } from "@common/utils/data/cache";
import type { Database, DatabaseKey } from "@common/utils/data/database";
import { DEFAULT_STORAGE } from "@common/utils/data/default-database";
import { TornToolsStorage } from "@common/utils/data/storage";
import { UserscriptRuntimeStorage } from "@userscripts/runtime/context/script-database-context";

export class TTScriptStorage extends TornToolsStorage {
	constructor(private readonly prefix: string) {
		super();
	}

	private storageKey(key: string): string {
		return key === "cache" ? key : `${this.prefix}_${key}`;
	}

	override get(): Promise<Database>;
	override get<K extends DatabaseKey>(key: K): Promise<Database[K]>;
	override get<K extends readonly DatabaseKey[]>(keys: K): Promise<{ [I in keyof K]: K[I] extends DatabaseKey ? Database[K[I]] : never }>;
	override async get(key?: DatabaseKey | DatabaseKey[]) {
		if (Array.isArray(key)) {
			return await Promise.all(key.map((k) => this.storageKey(k)).map((k) => GM.getValue(k)));
		} else if (key) {
			return await GM.getValue(this.storageKey(key));
		} else {
			const storageKeys = Object.keys(DEFAULT_STORAGE) as DatabaseKey[];
			const storageValues = await this.get(storageKeys);

			return storageKeys.reduce((total, k, i) => {
				total[k] = storageValues[i];
				return total;
			}, {});
		}
	}

	override async set(object: { [p: string]: any }): Promise<void> {
		await Promise.all(
			Object.entries(object).map(([key, value]) => {
				UserscriptRuntimeStorage.callback({ [key]: { newValue: value, oldValue: null } }, "local");
				return GM.setValue(this.storageKey(key), value);
			}),
		);
	}

	override remove(_key: string | string[]): Promise<void> {
		throw new Error("Method not implemented.");
	}

	override clear(): Promise<void> {
		throw new Error("Method not implemented.");
	}

	override reset(): Promise<void>;
	override reset(key: "attackHistory" | "stakeouts" | "factionStakeouts"): Promise<void>;
	override reset(_key?: "attackHistory" | "stakeouts" | "factionStakeouts"): Promise<void> {
		throw new Error("Method not implemented.");
	}

	override async setCacheEntries(entries: CacheEntry[]): Promise<void> {
		const cache = (await this.get("cache")) ?? {};
		applyCacheEntries(cache, entries);
		await this.set({ cache });
	}

	override async clearCache(section?: string): Promise<void> {
		const cache = (await this.get("cache")) ?? {};
		if (section) {
			delete cache[section];
		} else {
			for (const key of Object.keys(cache)) delete cache[key];
		}
		await this.set({ cache });
	}

	override getSize(): Promise<number> {
		throw new Error("Method not implemented.");
	}
}

function applyCacheEntries(cache: DatabaseCache, entries: CacheEntry[]) {
	for (const entry of entries) {
		const { section, key } = entry;
		if (entry.deleted) {
			if (section && cache[section]) delete cache[section][key];
			else delete cache[key];
		} else if (section) {
			if (!(section in cache)) cache[section] = {};
			cache[section][key] = entry.cacheValue;
		} else {
			cache[key] = entry.cacheValue;
		}
	}
}

export class PDAScriptStorage extends TornToolsStorage {
	override get(): Promise<Database>;
	override get<K extends DatabaseKey>(key: K): Promise<Database[K]>;
	override get<K extends readonly DatabaseKey[]>(keys: K): Promise<{ [I in keyof K]: K[I] extends DatabaseKey ? Database[K[I]] : never }>;
	override async get(key?: DatabaseKey | DatabaseKey[]) {
		if (Array.isArray(key)) {
			return await Promise.all(key.map(this.get.bind(this)));
		} else if (key) {
			if (key === "cache") return await GM.getValue(key);
			else return await PDA_storage.get(key);
		} else {
			const storageKeys = Object.keys(DEFAULT_STORAGE) as DatabaseKey[];
			const storageValues = await this.get(storageKeys);

			return storageKeys.reduce((total, k, i) => {
				total[k] = storageValues[i];
				return total;
			}, {});
		}
	}

	override async set(object: { [p: string]: any }): Promise<void> {
		await Promise.all(
			Object.entries(object).map(([key, value]) => {
				UserscriptRuntimeStorage.callback({ [key]: { newValue: value, oldValue: null } }, "local");

				if (key === "cache") return GM.setValue(key, value);
				else return PDA_storage.set(key, value);
			}),
		);
	}

	override async remove(key: string | string[]): Promise<void> {
		if (typeof key === "string") await PDA_storage.delete(key);
		else await Promise.all(key.map(PDA_storage.delete));
	}

	override async clear(): Promise<void> {
		await Promise.all((await PDA_storage.list()).map(PDA_storage.delete));
	}

	override reset(): Promise<void>;
	override reset(key: "attackHistory" | "stakeouts" | "factionStakeouts"): Promise<void>;
	override reset(_key?: "attackHistory" | "stakeouts" | "factionStakeouts"): Promise<void> {
		throw new Error("Method not implemented.");
	}

	override async setCacheEntries(entries: CacheEntry[]): Promise<void> {
		const cache = (await this.get("cache")) ?? {};
		applyCacheEntries(cache, entries);
		await this.set({ cache });
	}

	override async clearCache(section?: string): Promise<void> {
		const cache = (await this.get("cache")) ?? {};
		if (section) {
			delete cache[section];
		} else {
			for (const key of Object.keys(cache)) delete cache[key];
		}
		await this.set({ cache });
	}

	override async getSize(): Promise<number> {
		return (await PDA_storage.usage()).used;
	}
}
