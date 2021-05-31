"use strict";

const CUSTOM_API_ERROR = {
	NO_NETWORK: "tt-no_network",
	CANCELLED: "tt-cancelled",
};

const FETCH_TIMEOUT = 10 * TO_MILLIS.SECONDS;

async function fetchApi(location, options = {}) {
	options = {
		fakeResponse: false,
		section: "",
		id: "",
		selections: [],
		key: "",
		action: "",
		method: "GET",
		body: false,
		silent: false,
		succeedOnError: false,
		includeKey: false,
		...options,
	};

	return new Promise((resolve, reject) => {
		const PLATFORMS = {
			torn: "https://api.torn.com/",
			yata: "https://yata.yt/",
			tornstats: "https://beta.tornstats.com/",
			torntools: "https://torntools.gregork.com/",
			nukefamily: "https://www.nukefamily.org/",
		};

		let url, path;
		const params = new URLSearchParams();
		switch (location) {
			case "torn":
				url = PLATFORMS.torn;

				path = `${options.section}/${options.id || ""}`;

				params.append("selections", options.selections.join(","));
				params.append("key", options.key || api.torn.key);
				if (settings.apiUsage.comment) {
					// noinspection JSCheckFunctionSignatures
					params.append("comment", settings.apiUsage.comment);
				}
				break;
			case "tornstats":
				url = PLATFORMS.tornstats;

				let pathSections = ["api", "v1", options.key || api.torn.key];
				if (options.section) pathSections.push(options.section);

				path = pathSections.join("/");
				break;
			case "yata":
				url = PLATFORMS.yata;
				path = `api/v1/${options.section}`;
				break;
		}

		if (options.includeKey) {
			params.append("key", options.key || api.torn.key);
		}

		if (options.params) {
			for (const [key, value] of Object.entries(options.params)) {
				// noinspection JSCheckFunctionSignatures
				params.append(key, value);
			}
		}

		const fullUrl = `${url}${path}${params.toString() ? "?" + params : ""}`;
		let parameters = {};

		if (options.method === "POST") {
			parameters = {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(options.body),
			};
		}

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

		fetch(fullUrl, { ...parameters, signal: controller.signal })
			.then(async (response) => {
				let result = {};

				try {
					result = await response.json();
				} catch (error) {
					if (response.status === 200) {
						result.success = true;
					} else {
						result.success = false;
						result.error = new HTTPException(response.status);
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
			if (options.succeedOnError) {
				resolve(result);
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
					error = "Network issues";
					isLocal = true;
					code = CUSTOM_API_ERROR.NO_NETWORK;
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
	});
}

function fetchRelay(location, options = {}) {
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage({ action: "fetchRelay", location, options }, (response) => {
			if (response.error) return reject(response);
			else return resolve(response);
		});
	});
}

function changeAPIKey(key) {
	return new Promise((resolve, reject) => {
		fetchApi("torn", { section: "user", selections: ["profile"], key, silent: true })
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
	return api.torn.key && !api.torn.error && userdata && !!Object.keys(userdata).length;
}
