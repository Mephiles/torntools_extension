const CUSTOM_API_ERROR = {
	NO_NETWORK: "tt-no_network",
	NO_PERMISSION: "tt-no_permission",
	CANCELLED: "tt-cancelled",
} as const;

const FETCH_TIMEOUT = 10 * TO_MILLIS.SECONDS;

const FETCH_PLATFORMS = {
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
} as const;

const FACTION_ACCESS = {
	none: "none",
	basic: "basic",
	full_access: "full_access",
} as const;

interface FetchOptions {
	fakeResponse: boolean;
	section: string;
	id: undefined | string;
	selections: string[];
	legacySelections: string[];
	key: undefined | string;
	action: undefined | string;
	method: "GET" | "POST";
	body: undefined | any;
	silent: boolean;
	succeedOnError: boolean;
	includeKey: boolean;
	relay: boolean;
	params: { [key: string]: string };
}

type FetchLocation = keyof typeof FETCH_PLATFORMS | typeof FETCH_PLATFORMS.tornstats;

async function fetchData<R = any>(l: FetchLocation, partialOptions: Partial<FetchOptions> = {}): Promise<R> {
	const options: FetchOptions = {
		fakeResponse: false,
		section: undefined,
		id: undefined,
		selections: [],
		legacySelections: [],
		key: undefined,
		action: undefined,
		method: "GET",
		body: undefined,
		silent: false,
		succeedOnError: false,
		includeKey: false,
		relay: false,
		params: {},
		...partialOptions,
	};

	if (options.relay && SCRIPT_TYPE !== "BACKGROUND") {
		return chrome.runtime.sendMessage({ action: "fetchRelay", location: l, options: { ...options, relay: false } });
	}

	return new Promise(async (resolve, reject) => {
		let location: keyof typeof FETCH_PLATFORMS;
		if (!(l in FETCH_PLATFORMS)) {
			location = Object.entries(FETCH_PLATFORMS)
				.filter(([, value]) => l === value)
				.map<keyof typeof FETCH_PLATFORMS>(([key]) => key as keyof typeof FETCH_PLATFORMS)
				.find(() => true);
			if (!location) {
				throw new Error(`Unknown fetch platform was chosen: ${l}!`);
			}
		} else {
			location = l as keyof typeof FETCH_PLATFORMS;
		}

		let url: string, path: string, pathSections: string[], key: string;
		let headers: { [key: string]: string } = {};

		const params = new URLSearchParams();
		switch (location) {
			case "tornv2":
				url = FETCH_PLATFORMS.tornv2;

				path = `${options.section}/${options.id || ""}`;

				params.append("selections", [...options.selections, ...options.legacySelections].join(","));
				params.append("legacy", options.legacySelections.join(","));
				params.append("key", options.key || api.torn.key);
				if (settings.apiUsage.comment) {
					params.append("comment", settings.apiUsage.comment);
				}

				await ttUsage.add(location);
				break;
			case "torn_direct":
				url = FETCH_PLATFORMS.torn_direct;

				path = options.action;

				params.set("rfcv", getRFC());
				break;
			case "tornstats":
				url = FETCH_PLATFORMS.tornstats;

				pathSections = ["api", "v2", options.key || api.tornstats.key || api.torn.key];
				if (options.section) pathSections.push(options.section);
				if (options.id) pathSections.push(options.id);

				path = pathSections.join("/");
				await ttUsage.add(location);
				break;
			case "yata":
				url = FETCH_PLATFORMS.yata;

				pathSections = ["api", "v1", options.section];
				if (options.id) pathSections.push(options.id, "");
				if (options.includeKey) key = api.yata.key;

				path = pathSections.join("/");
				await ttUsage.add(location);
				break;
			case "prometheus":
				url = FETCH_PLATFORMS.prometheus;
				path = ["api", options.section].join("/");
				break;
			case "tornw3b":
				url = FETCH_PLATFORMS.tornw3b;
				path = ["api", options.section].join("/");
				break;
			case "ffscouter":
				url = FETCH_PLATFORMS.ffscouter;
				path = ["api", "v1", options.section].join("/");
				key = api.ffScouter.key;
				break;
			default:
				url = FETCH_PLATFORMS[location];
				path = options.section;
				break;
		}

		if (options.includeKey) {
			params.append("key", options.key || key || api.torn.key);
		}

		if (options.params) {
			for (const [key, value] of Object.entries(options.params)) {
				params.append(key, value);
			}
		}

		const fullUrl = `${url}${path}${params.toString() ? "?" + params : ""}`;
		let parameters = {};

		if (options.method.toUpperCase() === "POST") {
			let body: any;
			if (options.body instanceof URLSearchParams) body = options.body;
			else {
				body = JSON.stringify(options.body);
				headers["content-type"] = "application/json";
			}

			if (location === "torn_direct") {
				headers["x-requested-with"] = "XMLHttpRequest";
			}

			parameters = { method: "POST", body };
		}

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

		fetch(fullUrl, { ...parameters, headers, signal: controller.signal })
			.then(async (response) => {
				let result: any = {};

				try {
					result = await response.clone().json();
				} catch (error) {
					if (location === "torn_direct" || location === "laekna") {
						result = await response.clone().text();

						resolve(result);
						return;
					} else {
						if (controller.signal.aborted) {
							result.success = false;
							result.error = error;
						} else if (response.status === 200) {
							result.success = true;
						} else {
							result.success = false;
							result.error = new HTTPException(response.status);
						}

						result.metadata = {
							error,
							response,
							signal: controller.signal,
						};
					}
				}

				if (options.fakeResponse) {
					result = options.fakeResponse;
				}

				if (result.error) {
					await handleError(result);
				} else {
					if (isTornAPICall(location) && !options.silent && SCRIPT_TYPE === "BACKGROUND") {
						await getBadgeText()
							.then(async (value) => {
								if (value === "error") await setBadge("default");
							})
							.catch(() => console.error("TT - Couldn't get the badge text."));

						await ttStorage.change({ api: { torn: { online: true, error: "" } } });
					}

					resolve(result);
				}
			})
			.catch((error) => handleError(error))
			.then(() => clearTimeout(timeoutId));

		return fullUrl;

		async function handleError(result: any) {
			// eslint-disable-line no-inner-declarations
			if (options.succeedOnError) {
				resolve(result);
				await ttUsage.add(location);
				return;
			}

			if (result instanceof DOMException) {
				const error = "Request cancelled because it took too long.";
				const isLocal = false;
				const code = CUSTOM_API_ERROR.CANCELLED;

				if (isTornAPICall(location) && !options.silent && SCRIPT_TYPE === "BACKGROUND") {
					await ttStorage.change({ api: { torn: { online: false, error } } });
					await setBadge("error");
				}
				reject({ error, isLocal, code });
			} else if (result.constructor.name === "TypeError") {
				let error = result.message;
				let isLocal = false;
				let code: string | undefined = undefined;

				if (error === "Failed to fetch") {
					isLocal = true;
					if (SCRIPT_TYPE === "BACKGROUND" && !(await hasOrigins(url))) {
						error = "Permission issues";
						code = CUSTOM_API_ERROR.NO_PERMISSION;
					} else {
						error = "Network issues";
						code = CUSTOM_API_ERROR.NO_NETWORK;
					}
				}

				if (isTornAPICall(location) && !options.silent && SCRIPT_TYPE === "BACKGROUND") {
					await ttStorage.change({ api: { torn: { online: false, error } } });
					await setBadge("error");
				}
				reject({ error, isLocal, code });
			} else if (isTornAPICall(location)) {
				let error: string, online: boolean;

				if (result.error instanceof HTTPException) {
					error = result.error.toString();
					online = false;
				} else {
					error = result.error.error;
					online = result.error.code !== 9 && !(result instanceof HTTPException);
				}

				if (!options.silent && SCRIPT_TYPE === "BACKGROUND") {
					await ttStorage.change({ api: { torn: { online, error } } });
					await setBadge("error");
				}

				if (result.error instanceof HTTPException) {
					reject(result.error.asObject());
				} else {
					reject(result.error);
				}
			} else {
				reject({ error: result.error });
			}
		}
	});
}

function isTornAPICall(location: FetchLocation) {
	return ["tornv2"].includes(location);
}

async function checkAPIPermission(key: string) {
	try {
		const response = await fetchData("tornv2", { section: "key", selections: ["info"], key, silent: true });
		const { type, faction, company } = response.info.access;

		if (type === "Limited Access" || type === "Full Access") {
			return { access: true, faction, company };
		} else {
			return { access: false };
		}
	} catch (error) {
		throw error.error;
	}
}

async function changeAPIKey(key: string): Promise<void> {
	try {
		await fetchData("tornv2", { section: "user", selections: ["basic"], key, silent: true });
		await ttStorage.change({ api: { torn: { key } } });

		await chrome.runtime.sendMessage({ action: "initialize" });
	} catch (error) {
		throw error.error;
	}
}

function hasAPIData(): boolean {
	const hasKey = !!api?.torn?.key;
	const hasError = !!api?.torn?.error && !api.torn.error.includes("Backend error");
	const hasUserdata = !!(userdata && Object.keys(userdata).length);

	return hasKey && !hasError && hasUserdata;
}

function hasFactionAPIAccess(): boolean {
	if (!hasAPIData()) return false;

	return userdata.faction && factiondata?.access === FACTION_ACCESS.full_access;
}

function hasOC2Data(): boolean {
	if (!hasAPIData() || !("organizedCrime" in userdata)) return false;

	return userdata.organizedCrime === null || !("error" in userdata.organizedCrime);
}

function hasOC1Data(): boolean {
	if (!hasAPIData() || !("organizedCrime" in userdata)) return false;

	// 27: "Must be migrated to organized crimes 2.0"
	return userdata.organizedCrime !== null && userdata.organizedCrime.code === 27;
}

async function hasOrigins(...origins: string[]): Promise<boolean> {
	// We have permission for the entire domain, not just the api subdomain.
	origins = origins.map((origin) => origin.replaceAll("api.torn.com", "torn.com"));

	return chrome.permissions.contains({ origins });
}
