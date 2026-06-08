import { setFeatureManager, setRuntimeInformation, setRuntimeStorage, setScriptInjector, setTTStorage, ttStorage } from "@common/utils/context";
import { type DatabaseFilters, type DatabaseLocaldata, migrateDatabase, setFilters, setLocaldata } from "@common/utils/data/database";
import { DEFAULT_STORAGE, getDefaultStorage } from "@common/utils/data/default-database";
import { injectFetchListeners, injectXhrListeners, RequestListenerInjector, type ScriptInjector } from "@common/utils/functions/script-injector";
import type { Feature } from "@features/feature";
import type { FeatureManager } from "@features/feature-manager";
import { TTScriptStorage } from "@userscripts/runtime/script-storage";
import "@common/utils/global/globalStyle.css";
import "@common/utils/global/globalVariables.css";
import type { RuntimeInformation, RuntimeStorage } from "@common/utils/functions/context-interfaces";

export async function registerUserscriptContext(storagePrefix: string) {
	setTTStorage(new TTScriptStorage(storagePrefix));
	setFeatureManager(new ScriptFeatureManager());
	setScriptInjector(UserscriptScriptInjector);
	setRuntimeInformation(UserscriptRuntimeInformation);
	setRuntimeStorage(UserscriptRuntimeStorage);

	await migrateDatabase(true);

	const [localdata, filters] = await ttStorage.get(["localdata", "filters"]);

	setLocaldata((localdata ? localdata : getDefaultStorage(DEFAULT_STORAGE.localdata)) as DatabaseLocaldata);
	setFilters((filters ? filters : getDefaultStorage(DEFAULT_STORAGE.filters)) as DatabaseFilters);

	initializeScriptTheme();
}

function initializeScriptTheme() {
	document.documentElement.style.setProperty("--tt-theme-color", "#fff");
	document.documentElement.style.setProperty("--tt-theme-background", "var(--tt-background-green)");
}

class ScriptFeatureManager implements FeatureManager {
	createPopup() {}

	isEnabled(): boolean {
		return true;
	}

	registerFeature(feature: Feature): void {
		feature.initialise();
		feature.execute();
	}
}

const fetchListenerInjector = new RequestListenerInjector(injectFetchListeners);
const xhrListenerInjector = new RequestListenerInjector(injectXhrListeners);

export const UserscriptScriptInjector: ScriptInjector = {
	injectFetch() {
		fetchListenerInjector.inject();
	},
	injectXHR() {
		xhrListenerInjector.inject();
	},
};

export const UserscriptRuntimeInformation: RuntimeInformation = {
	getVersion(): string {
		return GM.info.version;
	},

	isUserscript(): boolean {
		return true;
	},
};

export const UserscriptRuntimeStorage: RuntimeStorage = {
	addChangeListener() {},
};
