import {
	type DataFetcher,
	type FetchResponse,
	type OffloadService,
	setDataFetcher,
	setEventHandler,
	setFeatureManager,
	setInformationRetriever,
	setOffloadService,
	setRuntimeInformation,
	setRuntimeStorage,
	setScriptInjector,
	setStaticItemResolver,
	setTTStorage,
} from "@common/utils/context";
import { torndata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import type { FetchLocation } from "@common/utils/functions/api-fetcher";
import { usingFirefox } from "@common/utils/functions/browser";
import type { RuntimeInformation, RuntimeStorage, TTWindow } from "@common/utils/functions/context-interfaces";
import { executeScript } from "@common/utils/functions/dom";
import type { ScriptInjector } from "@common/utils/functions/script-injector";
import { SCRIPT_TYPE } from "@common/utils/functions/utilities";
import type { FullItem, ItemResolver, StaticItem } from "@common/utils/torn-api/items.types";
import { browser } from "wxt/browser";
import { ExtensionEventHandler } from "@/runtime/extension-event-handler";
import { ExtensionFeatureManager } from "@/runtime/extension-feature-manager";
import { ExtensionInformationRetriever } from "@/runtime/extension-information-retriever";
import { TTExtensionStorage } from "@/runtime/extension-storage";
import { BACKGROUND_SERVICE } from "@/services/proxy-services";
import { STATIC_ITEM_MAP, STATIC_ITEMS } from "@/utils/static-data/static-items";

const BLACKLISTED_SCRIPT_TYPES: (typeof SCRIPT_TYPE)[] = ["BACKGROUND", "POPUP", "INTERNAL_CONTENT"];

export function registerExtensionContext() {
	setTTStorage(new TTExtensionStorage());
	if (typeof window !== "undefined" && !BLACKLISTED_SCRIPT_TYPES.includes(SCRIPT_TYPE)) {
		setFeatureManager(new ExtensionFeatureManager());
		setScriptInjector(ExtensionScriptInjector);
	}
	setInformationRetriever(ExtensionInformationRetriever);
	setEventHandler(ExtensionEventHandler);
	setRuntimeInformation(ExtensionRuntimeInformation);
	setRuntimeStorage(ExtensionRuntimeStorage);
	setOffloadService(ExtensionOffloadService);
	setDataFetcher(ExtensionDataFetcher);
	setStaticItemResolver(ExtensionItemResolver);
}

const ExtensionScriptInjector: ScriptInjector & { injectedFetch: boolean; injectedXHR: boolean; injectedCityItemsMap: boolean } = {
	injectedFetch: false,
	injectFetch() {
		if (this.injectedFetch) return;

		executeScript(browser.runtime.getURL("/fetch--inject.js"), false, true);
		this.injectedFetch = true;
	},
	injectedXHR: false,
	injectXHR() {
		if (this.injectedXHR) return;

		executeScript(browser.runtime.getURL("/xhr--inject.js"), false, true);
		this.injectedXHR = true;
	},
	injectedCityItemsMap: false,
	injectCityItemsMap() {
		if (this.injectedCityItemsMap) return;

		executeScript(browser.runtime.getURL("/city-items--inject.js"), false, true);
		this.injectedCityItemsMap = true;
	},
	injectEfficientRehab() {
		executeScript(browser.runtime.getURL("/efficient-rehab--inject.js"), false, true);
	},
};

const ExtensionRuntimeInformation: RuntimeInformation = {
	getWindow(): TTWindow {
		return usingFirefox() ? (window.wrappedJSObject! as TTWindow) : window;
	},

	getVersion(): string {
		return browser.runtime.getManifest().version;
	},

	isUserscript(): boolean {
		return false;
	},
};

const ExtensionRuntimeStorage: RuntimeStorage = {
	addChangeListener: (cb) => browser.storage.onChanged.addListener(cb),
};

const ExtensionOffloadService: OffloadService = {
	fetchRelay<R = any>(location: string, options: Record<string, any>): Promise<R> {
		return BACKGROUND_SERVICE.fetchRelay(location as FetchLocation, options) as Promise<R>;
	},
	initialize(): Promise<{ success: boolean; error?: any }> {
		return BACKGROUND_SERVICE.initialize();
	},
	async reinitializeTimers() {
		await BACKGROUND_SERVICE.reinitializeTimers();
	},
};

const ExtensionDataFetcher: DataFetcher = {
	async fetch(url: string, options?: { method?: string; headers?: Record<string, string>; body?: any; timeout?: number }): Promise<FetchResponse> {
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
	},
};

const ExtensionItemResolver: ItemResolver = {
	loadItem(id: number): StaticItem | FullItem | null {
		return this.getFullItem(id) ?? this.getStaticItem(id);
	},
	findItem(matcher: (item: StaticItem | FullItem) => boolean): StaticItem | FullItem | null {
		if (this.hasFullItems()) {
			const matched = this.getAllFullItems().find(matcher);

			if (matched) return matched;
		}
		return this.getAllStaticItems().find(matcher) ?? null;
	},
	getStaticItem(id: number): StaticItem | null {
		return id in STATIC_ITEM_MAP ? STATIC_ITEM_MAP[id] : null;
	},
	hasFullItems: () => hasAPIData(),
	getFullItem(id: number): FullItem | null {
		return torndata?.itemsMap && id in torndata.itemsMap ? (torndata.itemsMap[id] as FullItem) : null;
	},
	getAllFullItems(): FullItem[] {
		return (torndata?.items as FullItem[] | undefined) ?? [];
	},
	getAllStaticItems(): StaticItem[] {
		return STATIC_ITEMS;
	},
};
