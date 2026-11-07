import type { CacheEntry, DatabaseCache } from "@common/utils/data/cache";
import { api } from "@common/utils/data/database";
import type { Database, DatabaseKey, DatabaseNotes } from "@common/utils/data/database";
import { DEFAULT_STORAGE, getDefaultStorage } from "@common/utils/data/default-database";
import {
	bumpCacheVersion,
	CACHE_VERSION_KEY,
	FALLBACK_CACHE_KEY,
	getCache,
	removeCacheEntries,
	setCacheEntries as idbSetCacheEntries,
} from "@common/utils/data/idb-cache";
import { bumpNotesVersion, FALLBACK_NOTES_KEY, getNotes, NOTES_VERSION_KEY, removeNotes, setNotes as idbSetNotes } from "@common/utils/data/idb-notes";
import { TornToolsStorage } from "@common/utils/data/storage";
import { logger } from "@common/utils/functions/logger";
import { SCRIPT_TYPE } from "@common/utils/functions/utilities";
import { browser } from "wxt/browser";
import { BACKGROUND_SERVICE } from "@/services/proxy-services";

const isContentScript = SCRIPT_TYPE === "CONTENT";

function flattenCache(cache: DatabaseCache): CacheEntry[] {
	const entries: CacheEntry[] = [];
	for (const [sectionOrKey, sectionValue] of Object.entries(cache)) {
		if (sectionValue && typeof sectionValue === "object" && !("value" in sectionValue)) {
			for (const [key, cacheValue] of Object.entries(sectionValue as Record<string, CacheEntry["cacheValue"]>)) {
				entries.push({ section: sectionOrKey, key, cacheValue });
			}
		} else {
			entries.push({ key: sectionOrKey, cacheValue: sectionValue as CacheEntry["cacheValue"] });
		}
	}

	return entries;
}

async function readCache(): Promise<DatabaseCache | undefined> {
	return isContentScript ? BACKGROUND_SERVICE.cacheGet() : getCache();
}

async function writeCacheEntries(entries: CacheEntry[]): Promise<void> {
	if (isContentScript) {
		await BACKGROUND_SERVICE.cacheSetEntries(entries);
	} else {
		await idbSetCacheEntries(entries);
		await bumpCacheVersion();
	}
}

async function clearCacheFromStorage(section?: string): Promise<void> {
	if (isContentScript) {
		await BACKGROUND_SERVICE.cacheClearEntries(section);
	} else {
		await removeCacheEntries(section);
		await bumpCacheVersion();
	}
}

async function readNotes(): Promise<DatabaseNotes | undefined> {
	return isContentScript ? BACKGROUND_SERVICE.notesGet() : getNotes();
}

async function writeNotes(notes: DatabaseNotes): Promise<void> {
	if (isContentScript) {
		await BACKGROUND_SERVICE.notesSet(notes);
	} else {
		await idbSetNotes(notes);
		await bumpNotesVersion();
	}
}

async function clearNotesFromStorage(): Promise<void> {
	if (isContentScript) {
		await BACKGROUND_SERVICE.notesClear();
	} else {
		await removeNotes();
		await bumpNotesVersion();
	}
}

export class TTExtensionStorage extends TornToolsStorage {
	override get(): Promise<Database>;
	override get<K extends DatabaseKey>(key: K): Promise<Database[K]>;
	override get<K extends readonly DatabaseKey[]>(keys: K): Promise<{ [I in keyof K]: K[I] extends DatabaseKey ? Database[K[I]] : never }>;
	override async get(key?: DatabaseKey | DatabaseKey[]) {
		if (Array.isArray(key)) {
			const data = await browser.storage.local.get(key as string[]);
			if ((key as DatabaseKey[]).includes("cache")) {
				data.cache = await readCache();
			}
			if ((key as DatabaseKey[]).includes("notes")) {
				data.notes = await readNotes();
			}

			return key.map((i) => data[i]);
		} else if (key) {
			if (key === "cache") return await readCache();
			if (key === "notes") return await readNotes();
			return (await browser.storage.local.get([key]))[key];
		} else {
			const data = await browser.storage.local.get();
			delete data[CACHE_VERSION_KEY];
			delete data[FALLBACK_CACHE_KEY];
			delete data[NOTES_VERSION_KEY];
			delete data[FALLBACK_NOTES_KEY];

			const cache = await readCache();
			if (cache !== undefined) data.cache = cache;

			const notes = await readNotes();
			if (notes !== undefined) data.notes = notes;

			return data;
		}
	}

	override async set(object: { [key: string]: any }) {
		const cache = object.cache;
		const notes = object.notes;
		const rest = { ...object };
		delete rest.cache;
		delete rest.notes;

		if (cache !== undefined) {
			await writeCacheEntries(flattenCache(cache));
		}
		if (notes !== undefined) {
			await writeNotes(notes);
		}
		if (Object.keys(rest).length) {
			await browser.storage.local.set(rest);
		}
	}

	override async setCacheEntries(entries: CacheEntry[]) {
		await writeCacheEntries(entries);
	}

	override async clearCache(section?: string) {
		await clearCacheFromStorage(section);
	}

	override async remove(key: string | string[]) {
		const keys = Array.isArray(key) ? key : [key];

		const writes: Promise<void>[] = [];
		if (keys.includes("cache")) writes.push(clearCacheFromStorage());
		if (keys.includes("notes")) writes.push(clearNotesFromStorage());

		const rest = keys.filter((k) => k !== "cache" && k !== "notes");
		if (rest.length) writes.push(browser.storage.local.remove(rest));

		await Promise.all(writes);
	}

	override async clear() {
		await browser.storage.local.clear();
		await clearCacheFromStorage();
		await clearNotesFromStorage();
	}

	override async reset(key?: "attackHistory" | "stakeouts" | "factionStakeouts"): Promise<void> {
		if (key && ["attackHistory", "stakeouts", "factionStakeouts"].includes(key)) {
			await this.set({ [key]: getDefaultStorage(DEFAULT_STORAGE)[key] });
		} else {
			const apiKey = api ? api.torn.key : undefined;

			await this.clear();
			await this.set(getDefaultStorage(DEFAULT_STORAGE));
			await this.change({ api: { torn: { key: apiKey } } });

			logger.info("Storage cleared");
			logger.info("New storage", await this.get());
		}
	}

	override async getSize() {
		let size: number;

		if (browser.storage.local.getBytesInUse) {
			size = await browser.storage.local.getBytesInUse();
			size += JSON.stringify((await readCache()) ?? {}).length;
			size += JSON.stringify((await readNotes()) ?? {}).length;
		} else size = JSON.stringify(await this.get()).length;

		return size;
	}
}
