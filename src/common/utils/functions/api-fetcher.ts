import { api, settings } from "@common/utils/data/database";
import { ttStorage } from "@common/utils/data/storage";
import { getBadgeText, setBadge } from "@common/utils/functions/extension";
import { getRFC } from "@common/utils/functions/torn";
import { SCRIPT_TYPE, TO_MILLIS } from "@common/utils/functions/utilities";
import { BACKGROUND_SERVICE } from "@/services/proxy-services";

export const CUSTOM_API_ERROR = {
	NO_NETWORK: "tt-no_network",
	NO_PERMISSION: "tt-no_permission",
	CANCELLED: "tt-cancelled",
} as const;

export const FETCH_PLATFORMS = {
	tornv2: "https://api.torn.com/v2/",
	torn_direct: "https://www.torn.com/",
	yata: "https://yata.yt/",
	tornstats: "https://www.tornstats.com/",
	torntools: "https://torntools.gregork.com/",
	nukefamily: "https://nuke.family/",
	uhc: "https://tornuhc.eu/",
	stig: "https://api.no1irishstig.co.uk/",
	prometheus: "https://prombot.co.uk:8443/",
	lzpt: "https://api.lzpt.io/",
	wtf: "https://what-the-f.de/",
	tornw3b: "https://weav3r.dev/",
	ffscouter: "https://ffscouter.com/",
	laekna: "https://laekna-revive-bot.onrender.com/",
	tornintel: "https://torn-intel.com/",
} as const;

type FetchMethod = "GET" | "POST";

export interface FetchOptions {
	section: string;
	id: undefined | string | number;
	selections: string[];
	legacySelections: string[];
	key: undefined | string;
	action: undefined | string;
	method: FetchMethod;
	body: undefined | any;
	silent: boolean;
	includeKey: boolean;
	relay: boolean;
	params: { [key: string]: any };
}

export type FetchLocation = keyof typeof FETCH_PLATFORMS;

const TORN_API_PLATFORMS: FetchLocation[] = ["tornv2"];
const TEXT_RESPONSE_PLATFORMS: FetchLocation[] = ["torn_direct", "laekna"];

export async function fetchData<R = any>(location: FetchLocation, partialOptions: Partial<FetchOptions> = {}): Promise<R> {
	const options = mergeOptions(partialOptions);

	if (options.relay && SCRIPT_TYPE !== "BACKGROUND") {
		return relayToBackground(location, options);
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), decideTimeoutTimer(location));

	let result: ParsedResult;
	try {
		const request = buildFetchRequest(location, options);
		const response = await fetch(request.url, {
			method: request.method,
			...(request.method === "POST" ? { body: request.body } : {}),
			headers: request.headers,
			signal: controller.signal,
		});

		result = await parseResponse(response, location, controller);
	} catch (error) {
		return await handleError(location, options, error);
	} finally {
		clearTimeout(timeoutId);
	}

	if (!result.success) {
		return await handleError(location, options, result);
	} else if (isApiErrorResponse(result.data)) {
		return await handleError(location, options, result.data);
	}

	await handleTornApiState(location, options);
	return result.data;
}

function mergeOptions(partial: Partial<FetchOptions>): FetchOptions {
	return {
		section: undefined,
		id: undefined,
		selections: [],
		legacySelections: [],
		key: undefined,
		action: undefined,
		method: "GET",
		body: undefined,
		silent: false,
		includeKey: false,
		relay: false,
		params: {},
		...partial,
	};
}

async function relayToBackground<R = any>(location: FetchLocation, options: FetchOptions): Promise<R> {
	return new Promise((resolve, reject) => {
		(BACKGROUND_SERVICE.fetchRelay(location, { ...options, relay: false }) as Promise<R>)
			.then((response) => resolve(response))
			.catch((error) => {
				if (error.name === "NonError") {
					reject(JSON.parse(error.message));
				} else {
					reject(new Error(error));
				}
			});
	});
}

function decideTimeoutTimer(location: FetchLocation): number {
	switch (location) {
		case "yata":
			return 30 * TO_MILLIS.SECONDS;
		default:
			return 10 * TO_MILLIS.SECONDS;
	}
}

type FetchRequest = {
	url: string;
	headers: Record<string, string>;
} & ({ method: "GET" } | { method: "POST"; body: any });

function buildFetchRequest(location: FetchLocation, options: FetchOptions): FetchRequest {
	const url = buildUrl(location, options);
	const headers: Record<string, string> = buildHeaders(location, options);

	if (options.method === "POST") return { url, method: options.method, body: buildBody(options), headers };
	else return { url, method: options.method, headers };
}

function buildUrl(location: FetchLocation, options: FetchOptions): string {
	let path: string, pathSections: (string | number)[], key: string;

	const params = new URLSearchParams();
	switch (location) {
		case "tornv2":
			path = `${options.section}/${options.id || ""}`;

			params.append("selections", [...options.selections, ...options.legacySelections].join(","));
			params.append("legacy", options.legacySelections.join(","));
			if (settings.apiUsage.comment) {
				params.append("comment", settings.apiUsage.comment);
			}

			break;
		case "torn_direct":
			path = options.action;

			params.set("rfcv", getRFC());
			break;
		case "tornstats":
			pathSections = ["api", "v2", options.key || api.tornstats.key || api.torn.key];
			if (options.section) pathSections.push(options.section);
			if (options.id) pathSections.push(options.id);

			path = pathSections.join("/");
			break;
		case "yata":
			pathSections = ["api", "v1", options.section];
			if (options.id) pathSections.push(options.id, "");
			if (options.includeKey) key = api.yata.key;

			path = pathSections.join("/");
			break;
		case "prometheus":
			path = ["api", options.section].join("/");
			break;
		case "tornw3b":
			path = ["api", options.section].join("/");
			break;
		case "ffscouter":
			path = ["api", "v1", options.section].join("/");
			key = api.ffScouter.key;
			break;
		case "tornintel":
			path = ["api", options.section].join("/");
			break;
		default:
			path = options.section;
			break;
	}

	if (options.includeKey) {
		params.append("key", options.key || key || api.torn.key);
	}

	if (options.params) {
		for (const [key, value] of Object.entries(options.params)) {
			params.append(key, value.toString());
		}
	}

	return `${FETCH_PLATFORMS[location]}${path}${params.toString() ? `?${params}` : ""}`;
}

function buildHeaders(location: FetchLocation, options: FetchOptions): Record<string, string> {
	const headers: Record<string, string> = {};

	if (location === "tornv2") {
		headers["Authorization"] = `ApiKey ${options.key || api.torn.key}`;
	}

	if (options.method === "POST") {
		if (!(options.body instanceof URLSearchParams)) {
			headers["content-type"] = "application/json";
		}

		if (location === "torn_direct") {
			headers["x-requested-with"] = "XMLHttpRequest";
		}
	}

	return headers;
}

function buildBody(options: FetchOptions) {
	if (options.method !== "POST") return null;

	return options.body instanceof URLSearchParams ? options.body : JSON.stringify(options.body);
}

type ParsedResult = { data?: any } & ({ success: true } | { success: false; error: any });

async function parseResponse(response: Response, location: FetchLocation, controller: AbortController): Promise<ParsedResult> {
	try {
		return { data: await response.clone().json(), success: true };
	} catch (parseError) {
		if (TEXT_RESPONSE_PLATFORMS.includes(location)) {
			return { data: await response.clone().text(), success: true };
		}

		if (controller.signal.aborted) return { success: false, error: parseError };
		else if (response.status === 200) return { success: true };
		return { success: false, error: new HTTPException(response.status) };
	}
}

async function handleError(location: FetchLocation, options: FetchOptions, result: any): Promise<never> {
	if (result instanceof DOMException) {
		return handleTimeoutError(location, options);
	}

	if (result.constructor.name === "TypeError") {
		return handleNetworkError(location, options, result.message);
	}

	return handleApiError(location, options, result);
}

async function handleTimeoutError(location: FetchLocation, options: FetchOptions): Promise<never> {
	const error = "Request cancelled because it took too long.";

	await handleTornApiState(location, options, error);

	throw { error, isLocal: false, code: CUSTOM_API_ERROR.CANCELLED };
}

async function handleTornApiState(location: FetchLocation, options: FetchOptions, error?: string, online = false) {
	if (!TORN_API_PLATFORMS.includes(location) || options.silent || SCRIPT_TYPE !== "BACKGROUND") return;

	if (error) {
		await ttStorage.change({ api: { torn: { online, error } } });
		await setBadge("error");
	} else {
		await getBadgeText()
			.then((value) => {
				if (value === "error") return setBadge("default");
			})
			.catch(() => console.error("TT - Couldn't get the badge text."));

		await ttStorage.change({ api: { torn: { online: true, error: "" } } });
	}
}

async function handleNetworkError(location: FetchLocation, options: FetchOptions, message: string): Promise<never> {
	let error = message;
	let isLocal = false;
	let code: string | undefined;

	if (error === "Failed to fetch") {
		isLocal = true;
		if (SCRIPT_TYPE === "BACKGROUND" && !(await hasOrigins(FETCH_PLATFORMS[location]))) {
			error = "Permission issues";
			code = CUSTOM_API_ERROR.NO_PERMISSION;
		} else {
			error = "Network issues";
			code = CUSTOM_API_ERROR.NO_NETWORK;
		}
	}

	await handleTornApiState(location, options, error);

	throw { error, isLocal, code };
}

async function hasOrigins(...origins: string[]): Promise<boolean> {
	return browser.permissions.contains({ origins });
}

async function handleApiError(location: FetchLocation, options: FetchOptions, result: any): Promise<never> {
	if (TORN_API_PLATFORMS.includes(location)) {
		let error: string, online: boolean;

		if (result.error instanceof HTTPException) {
			error = result.error.toString();
			online = false;
		} else {
			error = result.error.error;
			online = result.error.code !== 9 && !(result instanceof HTTPException);
		}

		await handleTornApiState(location, options, error, online);

		throw result.error instanceof HTTPException ? result.error.asObject() : result.error;
	}

	throw { error: result.error };
}

function isApiErrorResponse(data: any): data is { error: any } {
	return !!data && typeof data === "object" && "error" in data;
}

export class HTTPException {
	private readonly code: number;

	constructor(code: number) {
		this.code = code;
	}

	get message() {
		return this.code in HTTPException.codes ? HTTPException.codes[this.code] : `Unknown code (${this.code})`;
	}

	asObject() {
		return { code: this.code, message: this.message, http: true };
	}

	toString() {
		return `HTTP ${this.code}: ${this.message}`;
	}

	static get codes(): { [code: number]: string } {
		return {
			200: "OK",
			201: "Created",
			202: "Accepted",
			203: "Non-Authoritative Information",
			204: "No Content",
			205: "Reset Content",
			206: "Partial Content",
			300: "Multiple Choices",
			301: "Moved Permanently",
			302: "Found",
			303: "See Other",
			304: "Not Modified",
			305: "Use Proxy",
			306: "Unused",
			307: "Temporary Redirect",
			400: "Bad Request",
			401: "Unauthorized",
			402: "Payment Required",
			403: "Forbidden",
			404: "Not Found",
			405: "Method Not Allowed",
			406: "Not Acceptable",
			407: "Proxy Authentication Required",
			408: "Request Timeout",
			409: "Conflict",
			410: "Gone",
			411: "Length Required",
			412: "Precondition Required",
			413: "Request Entry Too Large",
			414: "Request-URI Too Long",
			415: "Unsupported Media Type",
			416: "Requested Range Not Satisfiable",
			417: "Expectation Failed",
			418: "I'm a teapot",
			429: "Too Many Requests",
			500: "Internal Server Error",
			501: "Not Implemented",
			502: "Bad Gateway",
			503: "Service Unavailable",
			504: "Gateway Timeout",
			505: "HTTP Version Not Supported",
		};
	}
}
