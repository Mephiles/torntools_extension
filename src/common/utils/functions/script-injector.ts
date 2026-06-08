import { SCRIPT_INJECTOR } from "@common/utils/context";
import { capitalizeText } from "@common/utils/functions/formatting";
import { isIntNumber } from "@common/utils/functions/utilities";

export interface ScriptInjector {
	getWindow(): Window;
	injectFetch(): void;
	injectXHR(): void;
}

declare global {
	interface Window {
		ttInjected: Record<string, boolean>;
	}
}

export class RequestListenerInjector {
	private readonly id: string;

	constructor(private readonly injectListeners: () => void) {
		this.id = capitalizeText(injectListeners.name);
	}

	inject() {
		if (this.isInjected()) return;

		this.injectListeners();
		this.setInjected();
	}

	private isInjected(): boolean {
		return document.documentElement.dataset[`tt${this.id}`] === "true";
	}

	private setInjected() {
		document.documentElement.dataset[`tt${this.id}`] = "true";
	}
}

export interface FetchDetails {
	page: string;
	text: string;
	json: undefined | { [key: string]: any };
	fetch: {
		url: string;
		body: any;
		status: number;
	};
}

export function injectFetchListeners() {
	const oldFetch = SCRIPT_INJECTOR.getWindow().fetch;
	(SCRIPT_INJECTOR.getWindow().fetch as any) = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> =>
		new Promise((resolve, reject) => {
			oldFetch(input, init)
				.then(async (response: Response) => {
					const page = response.url.substring(response.url.indexOf("torn.com/") + "torn.com/".length, response.url.indexOf(".php"));
					let json = {};
					try {
						json = await response.clone().json();
					} catch {}

					let body = null;
					if (init) {
						body = init.body;
						if (body !== null && typeof body === "object" && body?.constructor?.name === "FormData") {
							const newBody: { [key: string]: any } = {};

							for (const [key, value] of [...body]) {
								if (isIntNumber(value)) newBody[key] = parseFloat(value);
								else newBody[key] = value;
							}

							body = newBody;
						}
					}

					const url = response.url || (input as string);
					const detail: FetchDetails = {
						page,
						json,
						text: await response.clone().text(),
						fetch: {
							url,
							body,
							status: response.status,
						},
					};

					window.dispatchEvent(new CustomEvent<FetchDetails>("tt-fetch", { detail }));

					resolve(response);
				})
				.catch((error: any) => {
					reject(error);
				});
		});
}

export type XHRDetails = {
	page: string;
	xhr: {
		requestBody: string;
		response: any;
		responseType: XMLHttpRequest["responseType"];
		responseText: string;
		responseURL: string;
	};
} & ({ json: any; uri: undefined } | { uri: { [key: string]: string }; json: undefined });

export function injectXhrListeners() {
	const oldXHROpen = window.XMLHttpRequest.prototype.open;
	const oldXHRSend = window.XMLHttpRequest.prototype.send;

	window.XMLHttpRequest.prototype.open = function (method: string, url: string | URL) {
		let params = this["params"] ?? {};

		if ("xhrOpenAdjustments" in window && typeof window.xhrOpenAdjustments === "object") {
			for (const key in window.xhrOpenAdjustments) {
				if (typeof window.xhrOpenAdjustments[key] !== "function") continue;

				const adjustments = window.xhrOpenAdjustments[key]({ ...this }, method, url);

				method = adjustments.method;
				url = adjustments.url;

				params = { ...params, ...(adjustments.params || {}) };
			}
		}

		this["method"] = method;
		this["url"] = url;
		this["params"] = params;

		this.addEventListener("readystatechange", function () {
			if (this.readyState > 3 && this.status === 200) {
				const page = this.responseURL.substring(this.responseURL.indexOf("torn.com/") + "torn.com/".length, this.responseURL.indexOf(".php"));

				let json: any, uri: any;
				if (isJsonString(this.response)) json = JSON.parse(this.response);
				else uri = getUrlParams(this.responseURL);

				let text: string;
				if (this.responseType === "" || this.responseType === "text") text = this.responseText;

				window.dispatchEvent(
					new CustomEvent<XHRDetails>("tt-xhr", {
						detail: {
							page,
							json,
							uri,
							xhr: {
								// We used to pass the current XHR here as "...this"
								// but not possible due to some change in Chromium.
								// https://stackoverflow.com/a/53914790
								// https://issues.chromium.org/issues/40091619
								requestBody: this["requestBody"],
								response: this.response,
								responseType: this.responseType,
								responseText: text,
								responseURL: this.responseURL,
							},
						},
					}),
				);
			}
		});

		arguments[0] = method;
		arguments[1] = url;

		return oldXHROpen.apply(this, arguments as any);
	};
	window.XMLHttpRequest.prototype.send = function (body: XMLHttpRequestBodyInit | null) {
		this["params"] = this["params"] ?? {};
		if ("xhrSendAdjustments" in window && typeof window.xhrSendAdjustments === "object") {
			for (const key in window.xhrSendAdjustments) {
				if (typeof window.xhrSendAdjustments[key] !== "function") continue;

				body = window.xhrSendAdjustments[key]({ ...this }, body);
			}
		}

		this["requestBody"] = body;

		arguments[0] = body;

		return oldXHRSend.apply(this, arguments as any);
	};
}

/*
 * JavaScript Get URL Parameter (https://www.kevinleary.net/javascript-get-url-parameters/)
 */
function getUrlParams(url: string | undefined, prop?: string) {
	if (!url) url = location.href;

	const search = decodeURIComponent(url.slice(url.indexOf("?") + 1));
	const definitions = search.split("&");

	const params: { [key: string]: string } = {};
	definitions.forEach((val) => {
		const parts = val.split("=", 2);

		params[parts[0]] = parts[1];
	});

	return prop && prop in params ? params[prop] : params;
}

function isJsonString(str: string) {
	if (!str || str === "") return false;

	try {
		JSON.parse(str);
	} catch {
		return false;
	}
	return true;
}
