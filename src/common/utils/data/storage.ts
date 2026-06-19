import type { Database, DatabaseKey, RecursivePartial, Writable } from "@common/utils/data/database";

type ChangeFunction = (database: Writable<Database>) => void;

export abstract class TornToolsStorage {
	abstract get(): Promise<Database>;
	abstract get<K extends DatabaseKey>(key: K): Promise<Database[K]>;
	abstract get<K extends readonly DatabaseKey[]>(keys: K): Promise<{ [I in keyof K]: K[I] extends DatabaseKey ? Database[K[I]] : never }>;

	abstract set(object: { [key: string]: any }): Promise<void>;

	abstract remove(key: string | string[]): Promise<void>;

	abstract clear(): Promise<void>;

	async change(object: RecursivePartial<Writable<Database>>): Promise<void>;
	async change(fn: ChangeFunction): Promise<void>;
	async change(objectOrFn: RecursivePartial<Writable<Database>> | ChangeFunction): Promise<void> {
		if (typeof objectOrFn === "function") {
			const database = await this.get();
			objectOrFn(database);
			await this.set(database);
		} else {
			const keys = Object.keys(objectOrFn) as DatabaseKey[];
			for (const key of keys) {
				const data = this.recursive(await this.get(key), objectOrFn[key]);

				await this.set({ [key]: data });
			}
		}
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
	abstract reset(key: "attackHistory" | "stakeouts" | "factionStakeouts"): Promise<void>;

	abstract getSize(): Promise<number>;
}
