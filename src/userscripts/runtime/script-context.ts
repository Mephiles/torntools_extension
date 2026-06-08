import type { DataFetcher, FetchResponse, OffloadService } from "@common/utils/context";
import {
	setDataFetcher,
	setFeatureManager,
	setOffloadService,
	setRuntimeInformation,
	setRuntimeStorage,
	setScriptInjector,
	setTTStorage,
	ttStorage,
} from "@common/utils/context";
import { type DatabaseFilters, type DatabaseLocaldata, migrateDatabase, setFilters, setLocaldata } from "@common/utils/data/database";
import { DEFAULT_STORAGE, getDefaultStorage } from "@common/utils/data/default-database";
import { injectFetchListeners, injectXhrListeners, RequestListenerInjector, type ScriptInjector } from "@common/utils/functions/script-injector";
import type { Feature } from "@features/feature";
import type { FeatureManager } from "@features/feature-manager";
import { TTScriptStorage } from "@userscripts/runtime/script-storage";
import "@common/utils/global/globalStyle.css";
import "@common/utils/global/globalVariables.css";
import { type DatabaseCache, ttCache } from "@common/utils/data/cache";
import type { RuntimeInformation, RuntimeStorage } from "@common/utils/functions/context-interfaces";

export async function registerUserscriptContext(storagePrefix: string) {
	setTTStorage(new TTScriptStorage(storagePrefix));
	setFeatureManager(new ScriptFeatureManager());
	setScriptInjector(UserscriptScriptInjector);
	setRuntimeInformation(UserscriptRuntimeInformation);
	setRuntimeStorage(UserscriptRuntimeStorage);
	setOffloadService(ScriptOffloadService);
	setDataFetcher(ScriptDataFetcher);

	await migrateDatabase(true);
	const [localdata, filters, cache] = await ttStorage.get(["localdata", "filters", "cache"]);

	setLocaldata((localdata ? localdata : getDefaultStorage(DEFAULT_STORAGE.localdata)) as DatabaseLocaldata);
	setFilters((filters ? filters : getDefaultStorage(DEFAULT_STORAGE.filters)) as DatabaseFilters);
	ttCache.cache = cache ? cache : (getDefaultStorage(DEFAULT_STORAGE.cache) as DatabaseCache);

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

export const ScriptOffloadService: OffloadService = {
	fetchRelay<R = any>(_location: string, _options: Record<string, any>): Promise<R> {
		return Promise.reject(new Error("OffloadService is not available in script context. Use DataFetcher instead."));
	},
	initialize(): Promise<{ success: boolean; error?: any }> {
		return Promise.resolve({ success: true });
	},
};

export const ScriptDataFetcher: DataFetcher = {
	fetch(url: string, options?: { method?: string; headers?: Record<string, string>; body?: any; timeout?: number }): Promise<FetchResponse> {
		return new Promise((resolve, reject) => {
			GM.xmlHttpRequest({
				method: options?.method || "GET",
				url: url,
				headers: options?.headers,
				data: options?.method === "POST" ? (typeof options.body === "string" ? options.body : JSON.stringify(options.body)) : undefined,
				timeout: options?.timeout,
				onload: (response) => {
					resolve({ text: response.responseText, status: response.status, ok: response.status >= 200 && response.status < 300 });
				},
				onerror: (_error) => {
					reject(new TypeError("Failed to fetch"));
				},
				ontimeout: () => {
					reject(new DOMException("Request cancelled because it took too long.", "AbortError"));
				},
			});
		});
	},
};
