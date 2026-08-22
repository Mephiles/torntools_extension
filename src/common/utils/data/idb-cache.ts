import type { CacheEntry, DatabaseCache } from "@common/utils/data/cache";
import { browser } from "wxt/browser";

const DB_NAME = "tt-cache";
const DB_VERSION = 2;
const STORE_NAME = "cache";

export const CACHE_VERSION_KEY = "cacheVersion";

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

function openDatabase(): Promise<IDBDatabase> {
	if (databasePromise) return databasePromise;

	databasePromise = new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

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

export async function getCacheEntries(): Promise<CacheEntry[]> {
	const records = await withStore("readonly", (store) => store.getAll() as IDBRequest<StoredCacheEntry[]>);
	return records.map(({ section, key, cacheValue }) => ({
		section: section || undefined,
		key,
		cacheValue,
	}));
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
}

export async function removeCacheEntries(section?: string): Promise<void> {
	if (section === undefined) {
		await withStore("readwrite", (store) => store.clear());
	} else {
		await withStore("readwrite", (store) => store.delete(IDBKeyRange.bound([section, ""], [section, "\uffff"])));
	}
}
