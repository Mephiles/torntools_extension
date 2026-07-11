import { type DataFetcher, type FetchResponse, type OffloadService, setDataFetcher, setOffloadService, setStaticItemResolver } from "@common/utils/context";
import { FETCH_PLATFORMS } from "@common/utils/functions/api-fetcher";
import { getUUID } from "@common/utils/functions/utilities";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";

export function registerNetworkUserscriptContext() {
	setOffloadService(ScriptOffloadService);
	setDataFetcher(ScriptDataFetcher);
	setStaticItemResolver(ScriptItemResolver);
}

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
					console.debug("TT Userscripts - DataFetcher - onLoad", response);
					if (!response) {
						reject(new Error("Request has no actual response. Likely something went wrong in the fetch implementation."));
						return;
					}

					resolve({
						text: response.responseText,
						status: response.status,
						ok: response.status >= 200 && response.status < 300,
					});
				},
				onerror: (error) => {
					console.debug("TT Userscripts - DataFetcher - onError", error);
					reject(error);
				},
				ontimeout: () => {
					console.debug("TT Userscripts - DataFetcher - ontimeout");
					reject(new DOMException("Request cancelled because it took too long.", "AbortError"));
				},
			});
			console.debug("TT Userscripts - DataFetcher - Launched fetch");
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
