import { ttStorage } from "@common/utils/context";

export type DatabaseCache = { [key: string]: any };

type CacheKey = string | number;

export type CacheValue = { value: any } & ({ timeout: number } | { indefinite: true });

export interface CacheEntry {
	section?: string;
	key: string;
	cacheValue?: CacheValue;
	deleted?: boolean;
}

class TornToolsCache {
	private _cache: DatabaseCache;
	private persistTimer: ReturnType<typeof setTimeout> | null = null;
	private pendingChanges = new Map<string, CacheEntry>();

	constructor() {
		this._cache = {};
	}

	set cache(value) {
		this._cache = value || {};
		this.pendingChanges.clear();
	}

	syncCache(value: DatabaseCache) {
		this._cache = value || {};

		for (const { section, key, cacheValue, deleted } of this.pendingChanges.values()) {
			if (section) {
				if (deleted) {
					if (this._cache[section]) delete this._cache[section][key];
				} else {
					if (!(section in this._cache)) this._cache[section] = {};
					this._cache[section][key] = cacheValue;
				}
			} else if (deleted) {
				delete this._cache[key];
			} else {
				this._cache[key] = cacheValue;
			}
		}
	}

	get cache() {
		return this._cache;
	}

	// oxlint-disable-next-line no-unnecessary-type-parameters -- public generic API; callers pass explicit type args (e.g. ttCache.get<...>)
	get<T = any>(section: string, key?: CacheKey): T | undefined {
		return this.getCacheValue(section, key)?.value;
	}

	remove(section: string, key?: CacheKey) {
		const actualKey: string | number = key ?? section;
		const actualSection: string | null = key ? section : null;

		if ((actualSection && !this.hasValue(actualSection, actualKey)) || (!actualSection && !this.hasValue(actualKey.toString()))) {
			// Nothing to delete.
			return;
		}

		if (actualSection) delete this.cache[actualSection][actualKey];
		else delete this.cache[actualKey];

		this.pendingChanges.set(this.changeKey(actualSection ?? undefined, actualKey.toString()), {
			section: actualSection ?? undefined,
			key: actualKey.toString(),
			deleted: true,
		});
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
		} else if (actualKey in this.cache) {
			value = this.cache[actualKey];
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
				const cacheValue = this.createCacheValue(value, timeout);
				this.cache[section][key] = cacheValue;
				this.pendingChanges.set(this.changeKey(section, key), { section, key, cacheValue });
			}
		} else {
			for (const [key, value] of Object.entries(object)) {
				const cacheValue = this.createCacheValue(value, timeout);
				this.cache[key] = cacheValue;
				this.pendingChanges.set(this.changeKey(undefined, key), { key, cacheValue });
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

			for (const key of Array.from(this.pendingChanges.keys())) {
				if (key.startsWith(`${section}|`)) this.pendingChanges.delete(key);
			}

			await ttStorage.clearCache(section);
		} else {
			this.cache = {};
			if (this.persistTimer) clearTimeout(this.persistTimer);
			this.persistTimer = null;
			await ttStorage.clearCache();
		}
	}

	async refresh() {
		let hasChanged = false;
		const now = Date.now();

		const refreshObject = (object: { [key: string]: any }, section?: string) => {
			for (const key in object) {
				const value = object[key];

				if ("value" in value) {
					const cacheValue = value as CacheValue;
					if ("indefinite" in cacheValue || cacheValue.timeout > now) continue;

					hasChanged = true;
					delete object[key];
					this.pendingChanges.set(this.changeKey(section, key), { section, key, deleted: true });
				} else {
					refreshObject(value, key);
				}
			}
		};
		refreshObject(this.cache);

		for (const section in this.cache) {
			if (!Object.keys(this.cache[section]).length) delete this.cache[section];
		}

		if (hasChanged) await this.persist();
	}

	private schedulePersist() {
		if (this.persistTimer) clearTimeout(this.persistTimer);

		this.persistTimer = setTimeout(() => {
			this.persistTimer = null;
			this.persist().catch((err) => console.error("Failed to persist cache.", err));
		}, 500);
	}

	private async persist() {
		if (this.persistTimer) clearTimeout(this.persistTimer);

		if (!this.pendingChanges.size) return;

		const changes = Array.from(this.pendingChanges.values());
		await ttStorage.setCacheEntries(changes);

		for (const change of changes) {
			const key = this.changeKey(change.section, change.key);
			if (this.pendingChanges.get(key) === change) this.pendingChanges.delete(key);
		}

		this.persistTimer = null;
	}

	private changeKey(section: string | undefined, key: string): string {
		return `${section ?? ""}|${key}`;
	}
}

export const ttCache = new TornToolsCache();
