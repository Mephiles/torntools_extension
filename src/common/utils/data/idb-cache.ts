import type { CacheEntry, DatabaseCache } from "@common/utils/data/cache";
import { createIndexedDBStore } from "@common/utils/data/idb";
import { browser } from "wxt/browser";

const store = createIndexedDBStore("tt-cache", "cache", 2);

export const CACHE_VERSION_KEY = "cacheVersion";
export const FALLBACK_CACHE_KEY = "cache-fallback";

let cacheVersionCounter = 0;

export async function bumpCacheVersion(): Promise<void> {
	await browser.storage.local.set({ [CACHE_VERSION_KEY]: `${Date.now()}-${++cacheVersionCounter}` });
}

interface StoredCacheEntry {
	section: string;
	key: string;
	cacheValue: CacheEntry["cacheValue"];
}

type StoredEntryMap = Record<string, StoredCacheEntry>;
const entryKey = (section: string, key: string) => `${section}\u0000${key}`;

async function fallbackRead(): Promise<StoredEntryMap> {
	const stored = (await browser.storage.local.get(FALLBACK_CACHE_KEY))[FALLBACK_CACHE_KEY] as StoredEntryMap | undefined;
	return stored ? { ...stored } : {};
}

async function fallbackGetEntries(): Promise<StoredCacheEntry[]> {
	return Object.values(await fallbackRead());
}

async function fallbackApply(entries: CacheEntry[]): Promise<void> {
	const map = await fallbackRead();
	for (const entry of entries) {
		const key = entryKey(entry.section ?? "", entry.key);
		if (entry.deleted) {
			delete map[key];
		} else {
			map[key] = { section: entry.section ?? "", key: entry.key, cacheValue: entry.cacheValue };
		}
	}
	await browser.storage.local.set({ [FALLBACK_CACHE_KEY]: map });
}

async function fallbackClear(section?: string): Promise<void> {
	if (section === undefined) {
		await browser.storage.local.remove(FALLBACK_CACHE_KEY);
		return;
	}

	const map = await fallbackRead();
	for (const [key, entry] of Object.entries(map)) {
		if (entry.section === section) delete map[key];
	}
	await browser.storage.local.set({ [FALLBACK_CACHE_KEY]: map });
}

function toCacheEntry({ section, key, cacheValue }: StoredCacheEntry): CacheEntry {
	return { section: section || undefined, key, cacheValue };
}

export async function getCacheEntries(): Promise<CacheEntry[]> {
	try {
		const records = await store.run("readonly", (cacheStore) => cacheStore.getAll() as IDBRequest<StoredCacheEntry[]>);
		return records.map(toCacheEntry);
	} catch (error) {
		if (store.isAvailable) throw error;
		return (await fallbackGetEntries()).map(toCacheEntry);
	}
}

export async function getCache(): Promise<DatabaseCache | undefined> {
	const entries = await getCacheEntries();
	if (!entries.length) return undefined;

	const cache: DatabaseCache = {};
	for (const { section, key, cacheValue } of entries) {
		if (section) {
			if (!(section in cache)) cache[section] = {};
			cache[section][key] = cacheValue;
		} else {
			cache[key] = cacheValue;
		}
	}

	return cache;
}

export async function setCacheEntries(entries: CacheEntry[]): Promise<void> {
	try {
		await store.run("readwrite", (cacheStore) => {
			for (const entry of entries) {
				const section = entry.section ?? "";
				if (entry.deleted) {
					cacheStore.delete([section, entry.key]);
				} else {
					cacheStore.put({ section, key: entry.key, cacheValue: entry.cacheValue }, [section, entry.key]);
				}
			}
		});
	} catch (error) {
		if (store.isAvailable) throw error;
		await fallbackApply(entries);
	}
}

export async function removeCacheEntries(section?: string): Promise<void> {
	try {
		if (section === undefined) {
			await store.run("readwrite", (cacheStore) => cacheStore.clear());
		} else {
			await store.run("readwrite", (cacheStore) => cacheStore.delete(IDBKeyRange.bound([section], [section, []])));
		}
		await fallbackClear(section);
	} catch (error) {
		if (store.isAvailable) throw error;
		await fallbackClear(section);
	}
}
