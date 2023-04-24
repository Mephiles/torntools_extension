"use strict";

const CUSTOM_API_ERROR = {
	NO_NETWORK: "tt-no_network",
	NO_PERMISSION: "tt-no_permission",
	CANCELLED: "tt-cancelled",
};

const FETCH_TIMEOUT = 10 * TO_MILLIS.SECONDS;

const FETCH_PLATFORMS = {
	torn: "https://api.torn.com/",
	torn_direct: "https://www.torn.com/",
	yata: "https://yata.yt/",
	tornstats: "https://www.tornstats.com/",
	torntools: "https://torntools.gregork.com/",
	nukefamily: "https://www.nukefamily.org/",
	uhc: "https://tornuhc.eu/",
	imperium: "https://inq.mavri.dev/",
	hela: "https://api.no1irishstig.co.uk/",
	shadow_healers: "https://api.no1irishstig.co.uk/",
	prometheus: "https://prombot.co.uk:8443/",
	lzpt: "https://api.lzpt.io/",
	wtf: "https://what-the-f.de/",
};

const FACTION_ACCESS = {
	none: "none",
	basic: "basic",
	full_access: "full_access",
};

async function fetchData(location, options = {}) {
	options = {
		fakeResponse: false,
		section: undefined,
		id: undefined,
		selections: [],
		key: undefined,
		action: undefined,
		method: "GET",
		body: undefined,
		silent: false,
		succeedOnError: false,
		includeKey: false,
		relay: false,
		params: {},
		...options,
	};

	return new Promise(async (resolve, reject) => {
		if (options.relay && SCRIPT_TYPE !== "BACKGROUND") {
			chrome.runtime.sendMessage({ action: "fetchRelay", location, options: { ...options, relay: false } }, (response) => {
				if (response.error) return reject(response);
				else return resolve(response);
			});
		} else {
			let url, path, pathSections, key;

			const params = new URLSearchParams();
			switch (location) {
				case "torn":
					url = FETCH_PLATFORMS.torn;

					path = `${options.section}/${options.id || ""}`;

					params.append("selections", options.selections.join(","));
					params.append("key", options.key || api.torn.key);
					if (settings.apiUsage.comment) {
						// noinspection JSCheckFunctionSignatures
						params.append("comment", settings.apiUsage.comment);
					}

					await ttUsage.add(location);
					break;
				case "torn_direct":
					url = FETCH_PLATFORMS.torn_direct;

					path = options.action;

					params.set("rfcv", getRFC());
					break;
				case FETCH_PLATFORMS.tornstats:
					url = FETCH_PLATFORMS.tornstats;

					pathSections = ["api", "v2", options.key || api.tornstats.key || api.torn.key];
					if (options.section) pathSections.push(options.section);
					if (options.id) pathSections.push(options.id);

					path = pathSections.join("/");
					await ttUsage.add(location);
					break;
				case "yata":
				case FETCH_PLATFORMS.yata:
					url = FETCH_PLATFORMS.yata;

					pathSections = ["api", "v1", options.section];
					if (options.id) pathSections.push(options.id);
					if (options.includeKey) key = api.yata.key;

					path = pathSections.join("/");
					await ttUsage.add(location);
					break;
				case "nukefamily":
					url = FETCH_PLATFORMS.nukefamily;

					path = options.section;
					break;
				case "uhc":
					url = FETCH_PLATFORMS.uhc;

					path = options.section;
					break;
				case "imperium":
					url = FETCH_PLATFORMS.imperium;

					path = options.section;
					break;
				case "hela":
					url = FETCH_PLATFORMS.hela;

					path = options.section;
					break;
				case "shadow_healers":
					url = FETCH_PLATFORMS.shadow_healers;

					path = options.section;
					break;
				case "prometheus":
					url = FETCH_PLATFORMS.prometheus;

					path = ["api", options.section].join("/");
					break;
				case "lzpt":
					url = FETCH_PLATFORMS.lzpt;
					path = options.section;
					break;
				case "wtf":
					url = FETCH_PLATFORMS.wtf;
					path = options.section;
					break;
			}

			if (options.includeKey) {
				params.append("key", options.key || key || api.torn.key);
			}

			if (options.params) {
				for (const [key, value] of Object.entries(options.params)) {
					// noinspection JSCheckFunctionSignatures
					params.append(key, value);
				}
			}

			const fullUrl = `${url}${path}${params.toString() ? "?" + params : ""}`;
			let parameters = {};

			if (options.method.toUpperCase() === "POST") {
				const headers = {};

				let body;
				if (options.body instanceof URLSearchParams) body = options.body;
				else {
					body = JSON.stringify(options.body);
					headers["content-type"] = "application/json";
				}

				if (location === "torn_direct") {
					headers["x-requested-with"] = "XMLHttpRequest";
				}

				parameters = { method: "POST", headers, body };
			}

			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

			fetch(fullUrl, { ...parameters, signal: controller.signal })
				.then(async (response) => {
					let result = {};

					try {
						result = await response.clone().json();
					} catch (error) {
						if (location === "torn_direct") {
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
						if (location === "torn" && !options.silent && SCRIPT_TYPE === "BACKGROUND") {
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

			async function handleError(result) {
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

					if (location === "torn" && !options.silent && SCRIPT_TYPE === "BACKGROUND") {
						await ttStorage.change({ api: { torn: { online: false, error } } });
						await setBadge("error");
					}
					reject({ error, isLocal, code });
				} else if (result.constructor.name === "TypeError") {
					let error = result.message;
					let isLocal = false;
					let code;

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

					if (location === "torn" && !options.silent && SCRIPT_TYPE === "BACKGROUND") {
						await ttStorage.change({ api: { torn: { online: false, error } } });
						await setBadge("error");
					}
					reject({ error, isLocal, code });
				} else if (location === "torn") {
					let error, online;

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
		}
	});
}

function checkAPIPermission(key) {
	return new Promise((resolve, reject) => {
		fetchData("torn", { section: "key", selections: ["info"], key, silent: true })
			.then(async (response) => {
				const level = response.access_level;
				if (
					level === 3 || // Limited Access
					level === 4 // Full Access
				) {
					resolve(true);
				} else {
					resolve(false);
				}
			})
			.catch((error) => {
				reject(error.error);
			});
	});
}

function changeAPIKey(key) {
	return new Promise((resolve, reject) => {
		fetchData("torn", { section: "user", selections: ["profile"], key, silent: true })
			.then(async () => {
				await ttStorage.change({ api: { torn: { key } } });

				chrome.runtime.sendMessage({ action: "initialize" }, async () => {
					resolve();
				});
			})
			.catch((error) => {
				reject(error.error);
			});
	});
}

function hasAPIData() {
	const hasKey = !!api.torn.key;
	const hasError = !!api.torn.error && !api.torn.error.includes("Backend error");
	const hasUserdata = !!(userdata && Object.keys(userdata).length);

	return hasKey && !hasError && hasUserdata;
}

function hasFactionAPIAccess() {
	if (!hasAPIData()) return false;

	return factiondata?.access === FACTION_ACCESS.full_access;
}

async function hasOrigins(...origins) {
	return new Promise((resolve) => chrome.permissions.contains({ origins }, (granted) => resolve(granted)));
}
