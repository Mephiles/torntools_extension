import type { Database, DatabaseKey } from "@common/utils/data/database";
import { DEFAULT_STORAGE } from "@common/utils/data/default-database";
import { TornToolsStorage } from "@common/utils/data/storage";
import { UserscriptRuntimeStorage } from "@userscripts/runtime/context/script-database-context";

export class TTScriptStorage extends TornToolsStorage {
	constructor(private readonly prefix: string) {
		super();
	}

	private storageKey(key: DatabaseKey | string): string {
		return key === "cache" ? key : `${this.prefix}_${key}`;
	}

	get(): Promise<Database>;
	get<K extends DatabaseKey>(key: K): Promise<Database[K]>;
	get<K extends readonly DatabaseKey[]>(keys: K): Promise<{ [I in keyof K]: K[I] extends DatabaseKey ? Database[K[I]] : never }>;
	async get(key?: DatabaseKey | DatabaseKey[]) {
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

	async set(object: { [p: string]: any }): Promise<void> {
		await Promise.all(
			Object.entries(object).map(([key, value]) => {
				UserscriptRuntimeStorage.callback({ [key]: { newValue: value, oldValue: null } }, "local");
				return GM.setValue(this.storageKey(key), value);
			}),
		);
	}

	remove(_key: string | string[]): Promise<void> {
		throw new Error("Method not implemented.");
	}

	clear(): Promise<void> {
		throw new Error("Method not implemented.");
	}

	reset(): Promise<void>;
	reset(key: "attackHistory" | "stakeouts" | "factionStakeouts"): Promise<void>;
	reset(_key?: "attackHistory" | "stakeouts" | "factionStakeouts"): Promise<void> {
		throw new Error("Method not implemented.");
	}

	getSize(): Promise<number> {
		throw new Error("Method not implemented.");
	}
}
