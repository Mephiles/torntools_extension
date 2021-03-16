"use strict";

const CUSTOM_API_ERROR = {
	NO_NETWORK: "tt-no_network",
};

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

		if (options.params) {
			for (const [key, value] in Object.entries(options.params)) {
				params.append(key, value);
			}
		}

		const fullUrl = `${url}${path}?${params}`;
		let parameters = {};

		if (options.method === "POST") {
			parameters = {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(options.body),
			};
		}

		fetch(fullUrl, parameters)
			.then(async (response) => {
				let result = {};

				try {
					result = await response.json();
				} catch (error) {
					if (response.status === 200) {
						result.success = true;
					} else {
						result.success = false;
						result.error = "Unknown error";
					}
				}

				if (options.fakeResponse) {
					result = options.fakeResponse;
				}

				if (result.error) {
					await handleError(result);
				} else {
					if (location === "torn" && !options.silent) {
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
			.catch(async (error) => handleError(error));

		return fullUrl;

		async function handleError(result) {
			if (options.succeedOnError) {
				resolve(result);
				return;
			}

			if (result.constructor.name === "TypeError") {
				let error = result.message;
				let isLocal = false;
				let code;

				if (error === "Failed to fetch") {
					error = "Network issues";
					isLocal = true;
					code = CUSTOM_API_ERROR.NO_NETWORK;
				}

				if (location === "torn" && !options.silent) {
					await ttStorage.change({ api: { torn: { online: false, error } } });
					await setBadge("error");
				}
				reject({ error, isLocal, code });
			} else if (location === "torn") {
				let error, online;

				error = result.error.error;
				online = result.error.code !== 9;

				if (!options.silent) {
					await ttStorage.change({ api: { torn: { online, error } } });
					await setBadge("error");
				}
				reject({ ...result.error });
			} else {
				reject({ error: result.error });
			}
		}
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
