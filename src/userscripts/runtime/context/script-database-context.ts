import { setRuntimeStorage, setTTStorage, ttStorage } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import type { DatabaseCache } from "@common/utils/data/cache";
import { initializeDatabaseListener, migrateDatabase, setFilters, setLocaldata } from "@common/utils/data/database";
import type { DatabaseFilters, DatabaseLocaldata } from "@common/utils/data/database";
import { DEFAULT_STORAGE, getDefaultStorage } from "@common/utils/data/default-database";
import type { RuntimeStorage, StorageChangeCallback } from "@common/utils/functions/context-interfaces";
import { PDAScriptStorage, SharedSettingsScriptStorage, TTScriptStorage } from "@userscripts/runtime/script-storage";
import type { SettingsManifest } from "@userscripts/settings/settings-manifest";
import { registerScript } from "@userscripts/settings/shared-settings";
import { isPDA } from "@userscripts/utils/script-utils";

export async function registerDatabaseUserscriptContext(storagePrefix: string, manifest?: SettingsManifest) {
	const base = isPDA() ? new PDAScriptStorage() : new TTScriptStorage(storagePrefix);

	setTTStorage(new SharedSettingsScriptStorage(base, manifest));
	setRuntimeStorage(UserscriptRuntimeStorage);

	if (manifest) registerScript(storagePrefix, manifest);

	await migrateDatabase(true, { skipSharedSettings: true });
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
