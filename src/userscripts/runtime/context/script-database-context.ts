import { setRuntimeStorage, setTTStorage, ttStorage } from "@common/utils/context";
import { type DatabaseCache, ttCache } from "@common/utils/data/cache";
import {
	type DatabaseFilters,
	type DatabaseLocaldata,
	initializeDatabaseListener,
	migrateDatabase,
	setFilters,
	setLocaldata,
} from "@common/utils/data/database";
import { DEFAULT_STORAGE, getDefaultStorage } from "@common/utils/data/default-database";
import type { RuntimeStorage, StorageChangeCallback } from "@common/utils/functions/context-interfaces";
import { TTScriptStorage } from "@userscripts/runtime/script-storage";

export async function registerDatabaseUserscriptContext(storagePrefix: string) {
	setTTStorage(new TTScriptStorage(storagePrefix));
	setRuntimeStorage(UserscriptRuntimeStorage);

	await migrateDatabase(true);
	initializeDatabaseListener();
	const [localdata, filters, cache] = await ttStorage.get(["localdata", "filters", "cache"]);

	setLocaldata((localdata ? localdata : getDefaultStorage(DEFAULT_STORAGE.localdata)) as DatabaseLocaldata);
	setFilters((filters ? filters : getDefaultStorage(DEFAULT_STORAGE.filters)) as DatabaseFilters);
	ttCache.cache = cache ? cache : (getDefaultStorage(DEFAULT_STORAGE.cache) as DatabaseCache);
}

export const UserscriptRuntimeStorage: RuntimeStorage & { callback: StorageChangeCallback } = {
	callback: () => {},
	addChangeListener(callback: StorageChangeCallback) {
		this.callback = callback;
	},
};
