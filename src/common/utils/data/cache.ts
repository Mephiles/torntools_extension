import { ttStorage } from "@common/utils/context";

export type DatabaseCache = { [key: string]: any };

type CacheKey = string | number;

type CacheValue = { value: any } & ({ timeout: number } | { indefinite: true });

class TornToolsCache {
	private _cache: DatabaseCache;
	private persistTimer: ReturnType<typeof setTimeout> | null = null;

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
		const actualKey: string | number = key ?? section;
		const actualSection: string | null = key ? section : null;

		if ((actualSection && !this.hasValue(actualSection, actualKey)) || (!actualSection && !this.hasValue(actualKey.toString()))) {
			// Nothing to delete.
			return;
		}

		if (actualSection) delete this.cache[actualSection][actualKey];
		else delete this.cache[actualKey];

		this.schedulePersist();
	}

	hasValue(section: string, key?: CacheKey) {
		return this.getCacheValue(section, key) !== null;
	}

	private getCacheValue(section: string, key?: CacheKey): CacheValue | null {
		const actualKey: string | number = key ?? section;
		const actualSection: string | null = key ? section : null;

		let value: CacheValue | null = null;
		if (actualSection) {
			if (section in this.cache && actualKey in this.cache[actualSection]) {
				value = this.cache[actualSection][actualKey];
			}
		} else {
			if (actualKey in this.cache) {
				value = this.cache[actualKey];
			}
		}

		if (value === null || !("value" in value)) return null;

		if ("indefinite" in value) return value;
		else return value.timeout > Date.now() ? value : null;
	}

	set(object: DatabaseCache, ttl: number, section?: string) {
		return this._set(object, ttl, section);
	}

	setIndefinite(object: DatabaseCache, section?: string) {
		return this._set(object, null, section);
	}

	private _set(object: DatabaseCache, ttl: number | null, section?: string) {
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

		this.schedulePersist();
	}

	private createCacheValue(value: any, timeout: number | null): CacheValue {
		if (timeout === null) return { value, indefinite: true };
		else return { value, timeout };
	}

	async clear(section?: string) {
		if (section) {
			delete this.cache[section];
			this.schedulePersist();
		} else {
			this.cache = {};
			if (this.persistTimer) clearTimeout(this.persistTimer);
			this.persistTimer = null;
			await ttStorage.set({ cache: {} });
		}
	}

	async refresh() {
		let hasChanged = false;
		const now = Date.now();

		refreshObject(this.cache);

		for (const section in this.cache) {
			if (!Object.keys(this.cache[section]).length) delete this.cache[section];
		}

		if (hasChanged) this.schedulePersist();

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

	private schedulePersist() {
		if (this.persistTimer) clearTimeout(this.persistTimer);

		this.persistTimer = setTimeout(() => {
			this.persistTimer = null;
			ttStorage.set({ cache: this.cache }).catch((err) => console.error("Failed to persist cache.", err));
		}, 500);
	}
}

export const ttCache = new TornToolsCache();
