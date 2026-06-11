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
} from "@common/utils/context";
import type { RuntimeInformation, RuntimeStorage } from "@common/utils/functions/context-interfaces";
import { executeScript } from "@common/utils/functions/dom";
import type { ScriptInjector } from "@common/utils/functions/script-injector";
import type { StaticItemResolver } from "@common/utils/torn-api/items";
import type { StaticItem } from "@common/utils/torn-api/items.types";
import { browser } from "wxt/browser";
import { ExtensionFeatureManager } from "@/runtime/extension-feature-manager";
import { TTExtensionStorage } from "@/runtime/extension-storage";
import { BACKGROUND_SERVICE } from "@/services/proxy-services";
import { STATIC_ITEM_MAP } from "@/utils/static-data/static-items";

export function registerExtensionContext() {
	setTTStorage(new TTExtensionStorage());
	if (typeof window !== "undefined") {
		setFeatureManager(new ExtensionFeatureManager());
		setScriptInjector(ExtensionScriptInjector);
	}
	setRuntimeInformation(ExtensionRuntimeInformation);
	setRuntimeStorage(ExtensionRuntimeStorage);
	setOffloadService(ExtensionOffloadService);
	setDataFetcher(ExtensionDataFetcher);
	setStaticItemResolver(ExtensionStaticItemResolver);
}

const ExtensionScriptInjector: ScriptInjector & { injectedFetch: boolean; injectedXHR: boolean } = {
	getWindow(): Window {
		return window;
	},
	injectedFetch: false,
	injectFetch() {
		if (this.injectedFetch) return;

		executeScript(browser.runtime.getURL("/fetch--inject.js"), false);
		this.injectedFetch = true;
	},
	injectedXHR: false,
	injectXHR() {
		if (this.injectedXHR) return;

		executeScript(browser.runtime.getURL("/xhr--inject.js"), false);
		this.injectedXHR = true;
	},
};

const ExtensionRuntimeInformation: RuntimeInformation = {
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
		return BACKGROUND_SERVICE.fetchRelay(location as any, options) as Promise<R>;
	},
	initialize(): Promise<{ success: boolean; error?: any }> {
		return BACKGROUND_SERVICE.initialize();
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

const ExtensionStaticItemResolver: StaticItemResolver = {
	getStaticItem(id: number): StaticItem | null {
		return id in STATIC_ITEM_MAP ? STATIC_ITEM_MAP[id] : null;
	},
};
