import { ttStorage } from "@/utils/common/data/storage";

export type DatabaseCache = { [key: string]: any };

type CacheKey = string | number;

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
		if (!key) {
			key = section;
			section = null;
		}

		if (section) return this.hasValue(section, key) ? this.cache[section][key].value : undefined;
		else return this.hasValue(key.toString()) ? this.cache[key].value : undefined;
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
		if (!key) {
			key = section;
			section = null;
		}

		if (section) return section in this.cache && key in this.cache[section] && this.cache[section][key].timeout > Date.now();
		else return key in this.cache && this.cache[key].timeout > Date.now();
	}

	async set(object: DatabaseCache, ttl: number, section?: string) {
		const timeout = Date.now() + ttl;
		if (section) {
			if (!(section in this.cache)) this.cache[section] = {};

			for (const [key, value] of Object.entries(object)) {
				this.cache[section][key] = { value, timeout };
			}
		} else {
			for (const [key, value] of Object.entries(object)) {
				this.cache[key] = { value, timeout };
			}
		}

		await ttStorage.set({ cache: this.cache });
	}

	clear() {
		ttStorage.set({ cache: {} }).then(() => (this.cache = {}));
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

				if ("timeout" in value) {
					if (value.timeout > now) continue;

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
