import type { Database, DatabaseKey } from "@common/utils/data/database";
import { TornToolsStorage } from "@common/utils/data/storage";

export class TTScriptStorage extends TornToolsStorage {
	get(): Promise<Database>;
	get<K extends DatabaseKey>(key: K): Promise<Database[K]>;
	get<K extends readonly DatabaseKey[]>(keys: K): Promise<{ [I in keyof K]: K[I] extends DatabaseKey ? Database[K[I]] : never }>;
	async get(key?: DatabaseKey | DatabaseKey[]) {
		if (Array.isArray(key)) {
			const allValues = await GM.getValues(key);

			return key.map((k) => allValues[k]);
		} else if (key) {
			return await GM.getValue(key);
		} else {
			return await GM.getValues();
		}
	}

	set(object: { [p: string]: any }): Promise<void> {
		return GM.setValues(object);
	}

	remove(_key: string | string[]): Promise<void> {
		throw new Error("Method not implemented.");
	}

	clear(): Promise<void> {
		throw new Error("Method not implemented.");
	}

	reset(): Promise<void>;
	reset(key: "attackHistory" | "stakeouts"): Promise<void>;
	reset(_key?: "attackHistory" | "stakeouts"): Promise<void> {
		throw new Error("Method not implemented.");
	}

	getSize(): Promise<number> {
		throw new Error("Method not implemented.");
	}
}
