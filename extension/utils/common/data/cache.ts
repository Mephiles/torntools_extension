import { ttStorage } from "@/utils/common/data/storage";

export type DatabaseCache = { [key: string]: any };

type CacheKey = string | number;

type CacheValue = { value: any } & ({ timeout: number } | { indefinite: true });

class TornToolsCache {
	private _cache: DatabaseCache;

	constructor() {
		this._cache = {};
	}

	set cache(value) {
		this._cache = value || {};
	}

	get cache() {
		return this._cache;
	}

	get<T = any>(section: string, key?: CacheKey): T | undefined {
		return this.getCacheValue(section, key)?.value;
	}

	async remove(section: string, key?: CacheKey) {
		if (!key) {
			key = section;
			section = null;
		}

		if ((section && !this.hasValue(section, key)) || (!section && !this.hasValue(key.toString()))) {
			// Nothing to delete.
			return;
		}

		if (section) delete this.cache[section][key];
		else delete this.cache[key];

		await ttStorage.set({ cache: this.cache });
	}

	hasValue(section: string, key?: CacheKey) {
		return this.getCacheValue(section, key) !== null;
	}

	private getCacheValue(section: string, key?: CacheKey): CacheValue | null {
		if (!key) {
			key = section;
			section = null;
		}

		let value: CacheValue | null = null;
		if (section) {
			if (section in this.cache && key in this.cache[section]) {
				value = this.cache[section][key];
			}
		} else {
			if (key in this.cache) {
				value = this.cache[key];
			}
		}

		if (value === null || !("value" in value)) return null;

		if ("indefinite" in value) return value;
		else return value.timeout > Date.now() ? value : null;
	}

	async set(object: DatabaseCache, ttl: number, section?: string) {
		return this._set(object, ttl, section);
	}

	setIndefinite(object: DatabaseCache, section?: string) {
		return this._set(object, null, section);
	}

	private async _set(object: DatabaseCache, ttl: number | null, section?: string) {
		const timeout = ttl === null ? null : Date.now() + ttl;
		if (section) {
			if (!(section in this.cache)) this.cache[section] = {};

			for (const [key, value] of Object.entries(object)) {
				this.cache[section][key] = this.createCacheValue(value, timeout);
			}
		} else {
			for (const [key, value] of Object.entries(object)) {
				this.cache[key] = this.createCacheValue(value, timeout);
			}
		}

		await ttStorage.set({ cache: this.cache });
	}

	private createCacheValue(value: any, timeout: number | null): CacheValue {
		if (timeout === null) return { value, indefinite: true };
		else return { value, timeout };
	}

	async clear(section?: string) {
		if (section) {
			delete this.cache[section];
			await ttStorage.set({ cache: this.cache });
		} else {
			ttStorage.set({ cache: {} }).then(() => (this.cache = {}));
		}
	}

	async refresh() {
		let hasChanged = false;
		const now = Date.now();

		refreshObject(this.cache);

		for (const section in this.cache) {
			if (!Object.keys(this.cache[section]).length) delete this.cache[section];
		}

		if (hasChanged) await ttStorage.set({ cache: this.cache });

		function refreshObject(object: { [key: string]: any }) {
			for (const key in object) {
				const value = object[key];

				if ("value" in value) {
					const cacheValue = value as CacheValue;
					if ("indefinite" in cacheValue || cacheValue.timeout > now) continue;

					hasChanged = true;
					delete object[key];
				} else {
					refreshObject(value);
				}
			}
		}
	}
}

export const ttCache = new TornToolsCache();
