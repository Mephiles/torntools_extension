import type { CacheEntry, DatabaseCache } from "@common/utils/data/cache";
import { browser } from "wxt/browser";

const DB_NAME = "tt-cache";
const DB_VERSION = 2;
const STORE_NAME = "cache";

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

let databasePromise: Promise<IDBDatabase> | null = null;
let idbAvailable = true;

function openDatabase(): Promise<IDBDatabase> {
	if (databasePromise) return databasePromise;
	if (!idbAvailable) return Promise.reject(new Error("IndexedDB is unavailable, falling back to extension storage"));

	databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
		let openRequest: IDBOpenDBRequest | undefined;
		try {
			openRequest = indexedDB.open(DB_NAME, DB_VERSION);
		} catch (error) {
			idbAvailable = false;
			databasePromise = null;
			reject(error);
			return;
		}
		const request = openRequest!;

		request.onupgradeneeded = () => {
			const database = request.result;
			if (!database.objectStoreNames.contains(STORE_NAME)) {
				database.createObjectStore(STORE_NAME);
			}
		};
		request.addEventListener("success", () => {
			const database = request.result;
			database.addEventListener("close", () => {
				databasePromise = null;
			});
			resolve(database);
		});
		request.addEventListener("error", () => {
			idbAvailable = false;
			databasePromise = null;
			reject(request.error);
		});
	});

	return databasePromise;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		request.addEventListener("success", () => resolve(request.result));
		request.addEventListener("error", () => reject(request.error));
	});
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
	return new Promise((resolve, reject) => {
		transaction.addEventListener("complete", () => resolve());
		transaction.addEventListener("error", () => reject(transaction.error));
		transaction.addEventListener("abort", () => reject(transaction.error));
	});
}

async function withStore<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T> | T): Promise<T> {
	const database = await openDatabase();
	const transaction = database.transaction(STORE_NAME, mode);
	const result = operation(transaction.objectStore(STORE_NAME));
	const value = result instanceof IDBRequest ? await requestToPromise(result) : result;
	await transactionDone(transaction);
	return value;
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
		const records = await withStore("readonly", (store) => store.getAll() as IDBRequest<StoredCacheEntry[]>);
		return records.map(toCacheEntry);
	} catch (error) {
		if (idbAvailable) throw error;
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
		await withStore("readwrite", (store) => {
			for (const entry of entries) {
				const section = entry.section ?? "";
				if (entry.deleted) {
					store.delete([section, entry.key]);
				} else {
					store.put({ section, key: entry.key, cacheValue: entry.cacheValue }, [section, entry.key]);
				}
			}
		});
	} catch (error) {
		if (idbAvailable) throw error;
		await fallbackApply(entries);
	}
}

export async function removeCacheEntries(section?: string): Promise<void> {
	try {
		if (section === undefined) {
			await withStore("readwrite", (store) => store.clear());
		} else {
			await withStore("readwrite", (store) => store.delete(IDBKeyRange.bound([section], [section, []])));
		}
	} catch (error) {
		if (idbAvailable) throw error;
		await fallbackClear(section);
	}
}
