import {
	type DataFetcher,
	type FetchResponse,
	type OffloadService,
	setDataFetcher,
	setFeatureManager,
	setOffloadService,
	setRuntimeInformation,
	setRuntimeStorage,
	setScriptInjector,
	setStaticItemResolver,
	setTTStorage,
	ttStorage,
} from "@common/utils/context";
import {
	type DatabaseFilters,
	type DatabaseLocaldata,
	initializeDatabaseListener,
	migrateDatabase,
	setFilters,
	setLocaldata,
} from "@common/utils/data/database";
import { DEFAULT_STORAGE, getDefaultStorage } from "@common/utils/data/default-database";
import { injectFetchListeners, injectXhrListeners, RequestListenerInjector, type ScriptInjector } from "@common/utils/functions/script-injector";
import { injectCityItemsMapListeners } from "@features/city-items/city-items-map";
import type { Feature } from "@features/feature";
import type { FeatureManager } from "@features/feature-manager";
import { TTScriptStorage } from "@userscripts/runtime/script-storage";
import "@common/utils/global/globalStyle.css";
import "@common/utils/global/globalVariables.css";
import { type DatabaseCache, ttCache } from "@common/utils/data/cache";
import { FETCH_PLATFORMS } from "@common/utils/functions/api-fetcher";
import type { RuntimeInformation, RuntimeStorage, StorageChangeCallback } from "@common/utils/functions/context-interfaces";
import { getUUID } from "@common/utils/functions/utilities";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";

export async function registerUserscriptContext(storagePrefix: string) {
	setTTStorage(new TTScriptStorage(storagePrefix));
	setFeatureManager(new ScriptFeatureManager());
	setScriptInjector(UserscriptScriptInjector);
	setRuntimeInformation(UserscriptRuntimeInformation);
	setRuntimeStorage(UserscriptRuntimeStorage);
	setOffloadService(ScriptOffloadService);
	setDataFetcher(ScriptDataFetcher);
	setStaticItemResolver(ScriptItemResolver);

	await migrateDatabase(true);
	initializeDatabaseListener();
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

function injectUserscriptCityItemsMapListeners() {
	injectCityItemsMapListeners(unsafeWindow);
}

const fetchListenerInjector = new RequestListenerInjector(injectFetchListeners);
const xhrListenerInjector = new RequestListenerInjector(injectXhrListeners);
const cityItemsMapListenerInjector = new RequestListenerInjector(injectUserscriptCityItemsMapListeners);

const UserscriptScriptInjector: ScriptInjector = {
	getWindow(): Window {
		return unsafeWindow;
	},
	injectFetch() {
		fetchListenerInjector.inject();
	},
	injectXHR() {
		xhrListenerInjector.inject();
	},
	injectCityItemsMap() {
		cityItemsMapListenerInjector.inject();
	},
};

const UserscriptRuntimeInformation: RuntimeInformation = {
	getVersion(): string {
		return GM.info.version;
	},

	isUserscript(): boolean {
		return true;
	},
};

export const UserscriptRuntimeStorage: RuntimeStorage & { callback: StorageChangeCallback } = {
	callback: () => {},
	addChangeListener(callback: StorageChangeCallback) {
		this.callback = callback;
	},
};

const ScriptOffloadService: OffloadService = {
	fetchRelay<R = any>(_location: string, _options: Record<string, any>): Promise<R> {
		return Promise.reject(new Error("OffloadService is not available in script context. Use DataFetcher instead."));
	},
	initialize(): Promise<{ success: boolean; error?: any }> {
		return Promise.resolve({ success: true });
	},
	reinitializeTimers(): Promise<void> {
		return Promise.resolve();
	},
};

const ScriptDataFetcher: DataFetcher = {
	fetch(url: string, options?: { method?: string; headers?: Record<string, string>; body?: any; timeout?: number }): Promise<FetchResponse> {
		console.debug("TT Userscripts - DataFetcher - Preparing fetch");
		if (url.startsWith(FETCH_PLATFORMS.torn_direct)) {
			return fetchOnPage(url, options);
		}

		return new Promise((resolve, reject) => {
			try {
				const u = new URL(url);
				u.searchParams.append("pda-cache-busting", getUUID());

				url = u.toString();
			} catch {}

			console.debug(
				"TT Userscripts - DataFetcher - Fetching through background",
				typeof GM,
				typeof GM !== "undefined" ? typeof GM.xmlHttpRequest : "N/A",
			);
			GM.xmlHttpRequest({
				method: options?.method || "GET",
				url,
				headers: options?.headers,
				data: options?.method === "POST" ? (typeof options.body === "string" ? options.body : JSON.stringify(options.body)) : undefined,
				timeout: options?.timeout,
				onload: (response) => {
					if (!response) {
						reject(new Error("Request has no actual response. Likely something went wrong in the fetch implementation."));
						return;
					}

					resolve({ text: response.responseText, status: response.status, ok: response.status >= 200 && response.status < 300 });
				},
				onerror: (error) => {
					reject(error);
				},
				ontimeout: () => {
					reject(new DOMException("Request cancelled because it took too long.", "AbortError"));
				},
			});
		});
	},
};

async function fetchOnPage(url: string, options?: { method?: string; headers?: Record<string, string>; body?: any; timeout?: number }): Promise<FetchResponse> {
	const controller = new AbortController();
	const timeoutId = options?.timeout ? setTimeout(() => controller.abort(), options.timeout) : undefined;

	try {
		const response = await fetch(url, {
			method: options?.method || "GET",
			...(options?.method === "POST" ? { body: options.body } : {}),
			headers: options?.headers,
			signal: controller.signal,
		});

		const text = await response.text();
		return { text, status: response.status, ok: response.ok };
	} finally {
		if (timeoutId) clearTimeout(timeoutId);
	}
}
