console.log("TT - Loading global functions.");

/*
 * Add prototype functions.
 */

function _find(element, selector) {
	if (selector.includes("=") && !selector.includes("[")) {
		const key = selector.split("=")[0];
		const value = selector.split("=")[1];

		for (let element of document.querySelectorAll(key)) {
			if (element.innerText === value) {
				return element;
			}
		}

		try {
			element.querySelector(selector);
		} catch (err) {
			return undefined;
		}
	}
	return element.querySelector(selector);
}

Document.prototype.find = function (selector) {
	return _find(this, selector);
};
Element.prototype.find = function (selector) {
	return _find(this, selector);
};

Document.prototype.findAll = function (selector) {
	return this.querySelectorAll(selector);
};
Element.prototype.findAll = function (selector) {
	return this.querySelectorAll(selector);
};

Document.prototype.setClass = function (className) {
	return this.setAttribute("class", className);
};
Element.prototype.setClass = function (className) {
	return this.setAttribute("class", className);
};

Document.prototype.newElement = function (options) {
	if (typeof options == "string") {
		return this.createElement(options);
	} else if (typeof options == "object") {
		let newElement = this.createElement(options.type);

		if (options.id) newElement.id = options.id;
		if (options.class) newElement.setAttribute("class", options.class);
		if (options.text) newElement.innerText = options.text;
		if (options.html) newElement.innerHTML = options.html;
		if (options.value) newElement.value = options.value;
		if (options.href) newElement.href = options.href;

		for (let child of options.children || []) newElement.appendChild(child);

		for (let attr in options.attributes) newElement.setAttribute(attr, options.attributes[attr]);

		for (let key in options.style) newElement.style[key] = options.style[key];

		return newElement;
	}
};

/*
 * Load some functions.
 */

/*
 * Load some normal functions.
 */

function getSearchParameters() {
	return new URL(window.location).searchParams;
}

function rotateElement(element, degrees) {
	let startDegrees = element.style.transform ? parseInt(element.style.transform.replace("rotate(", "").replace("deg)", "")) : 0;

	startDegrees = startDegrees % 360;
	element.style.transform = `rotate(${startDegrees}deg)`;

	const totalDegrees = startDegrees + degrees;
	const step = 1000 / degrees;

	let rotater = setInterval(function () {
		const currentRotation = element.style.transform ? parseInt(element.style.transform.replace("rotate(", "").replace("deg)", "")) : 0;
		let newRotation = currentRotation + step;

		if (currentRotation < totalDegrees && newRotation > totalDegrees) {
			newRotation = totalDegrees;
			clearInterval(rotater);
		}

		element.style.transform = `rotate(${newRotation}deg)`;
	}, 1);
}

function requireCondition(condition, attributes = {}) {
	attributes = {
		delay: 10,
		maxCycles: -1,
		...attributes,
	};

	return new Promise((resolve, reject) => {
		if (checkCondition()) return;

		let counter = 0;
		let checker = setInterval(() => {
			if (checkCounter(counter++) || checkCondition()) return clearInterval(checker);
		}, attributes.delay);

		function checkCondition() {
			let response = condition();
			if (!response) return;

			if (typeof response === "boolean") {
				if (response) return resolve();
			} else if (typeof response === "object") {
				if (response.hasOwnProperty("success")) {
					if (response.success === true) resolve(response.value);
					else reject(response.value);
				} else {
					resolve(response);
				}
			}
		}

		function checkCounter(count) {
			if (attributes.maxCycles <= 0) return false;

			if (count > attributes.maxCycles) {
				reject("Maximum cycles reached.");
				return true;
			}
			return false;
		}
	});
}

function requireElement(selector, attributes) {
	attributes = {
		invert: false,
		parent: document,
		...attributes,
	};

	return requireCondition(
		() => (attributes.invert && !attributes.parent.find(selector)) || (!attributes.invert && attributes.parent.find(selector)),
		attributes
	);
}

function requireSidebar() {
	return requireElement("#sidebar");
}

function requireContent() {
	return requireElement(".box-title");
}

function hasParent(element, attributes = {}) {
	if (!element.parentElement) return false;

	if (attributes.class && element.parentElement.classList.contains(attributes.class)) return true;
	if (attributes.id && element.parentElement.id === attributes.id) return true;

	return hasParent(element.parentElement, attributes);
}

function findParent(element, attributes = {}) {
	if (!element || !element.parentElement) return undefined;

	if (attributes.class && element.parentElement.classList.contains(attributes.class)) return element.parentElement;
	if (attributes.id && element.parentElement.id === attributes.id) return element.parentElement;
	if (attributes.has_attribute && element.parentElement.getAttribute(attributes.has_attribute) !== null) return element.parentElement;

	return findParent(element.parentElement, attributes);
}

function checkMobile() {
	return new Promise((resolve) => {
		if (typeof mobile === "boolean") return resolve(mobile);

		if (!window.location.host.includes("torn.com")) {
			resolve(false);
			return;
		}

		if (document.readyState === "complete" || document.readyState === "interactive") check();
		else window.addEventListener("DOMContentLoaded", check);

		function check() {
			mobile = window.innerWidth <= 600;

			resolve(mobile);
		}
	});
}

async function fetchApi(
	location,
	options = {
		// section (torn + yata)
		// selections (torn)
		// action (tornstats)
		// method
		// body [method === POST]
		// fakeResponse
		// silent
	}
) {
	return new Promise((resolve, reject) => {
		const PLATFORMS = {
			torn: "https://api.torn.com/",
			yata: "https://yata.alwaysdata.net/",
			torn_proxy: "https://torn-proxy.com/",
			tornstats: "https://www.tornstats.com/",
			torntools: "https://torntools.gregork.com/",
			nukefamily: "https://www.nukefamily.org/",
		};

		let url, path;
		let params = new URLSearchParams();
		switch (location) {
			case "torn":
				url = usingProxy() ? PLATFORMS.torn_proxy : PLATFORMS.torn;

				path = `${options.section}/${options.id || ""}`;

				params.append("selections", options.selections.join(","));
				params.append("key", options.key || api.torn.key);
				break;
			case "tornstats":
				if (usingProxy()) {
					url = PLATFORMS.torn_proxy;
					path = "tornstats/api.php";
				} else {
					url = PLATFORMS.tornstats;
					path = "api.php";
				}

				params.append("action", options.action);
				params.append("key", options.key || api.torn.key);
				break;
			case "yata":
				url = PLATFORMS.yata;
				path = `api/v1/${options.section}`;
				break;
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
					await handleError(result, options.silent);
				} else {
					if (location === "torn" && !options.silent) {
						await getBadgeText()
							.then((value) => {
								if (value === "error") setBadge("default");
							})
							.catch(() => console.error("TT - Couldn't get the badge text."));

						await ttStorage.change({ api: { torn: { online: true, error: "" } } });
					}

					resolve(result);
				}
			})
			.catch(async (error) => handleError(error));

		return fullUrl;

		async function handleError(result, silent) {
			if (result.proxy) {
				if (!silent) {
					await ttStorage.change({ api: { torn: { online: true, error: result.proxy_error } } });
					setBadge("error");
				}
				reject({ error: result.proxy_error });
			} else if (location === "torn") {
				let error, online;

				if (result.proxy) {
					error = result.proxy_error;
					online = true;
				} else {
					error = result.error.error;
					online = result.error.code !== 9;
				}

				if (!silent) {
					await ttStorage.change({ api: { torn: { online, error } } });
					setBadge("error");
				}
				reject({ error });
			} else {
				reject({ error: result.error });
			}
		}
	});

	function usingProxy() {
		return api.torn.key && api.torn.key.length === 32;
	}
}

function setBadge(type, options) {
	const TYPES = {
		default: { text: "" },
		error: { text: "error", color: "#FF0000" },
		count: {
			text: () => {
				if (options.events && options.messages) return `${options.events}/${options.messages}`;
				else if (options.events) return options.events.toString();
				else if (options.messages) return options.events.toString();
				else return false;
			},
			color: () => {
				if (options.events && options.messages) return "#1ed2ac";
				else if (options.events) return "#009eda";
				else if (options.messages) return "#84af03";
				else return false;
			},
		},
	};

	const badge = TYPES[type];
	if (typeof badge.text === "function") badge.text = badge.text();
	if (typeof badge.color === "function") badge.color = badge.color();
	if (!badge.text) badge.text = "";

	chrome.browserAction.setBadgeText({ text: badge.text || "" });
	if (badge.color) chrome.browserAction.setBadgeBackgroundColor({ color: badge.color });
}

function getBadgeText() {
	return new Promise((resolve) => chrome.browserAction.getBadgeText({}, resolve));
}

function isSameUTCDay(date1, date2) {
	return date1.setUTCHours(24, 0, 0, 0) === date2.setUTCHours(24, 0, 0, 0);
}

function showLoadingPlaceholder(element, show) {
	if (show) {
		if (element.find(".tt-loading-placeholder")) {
			element.find(".tt-loading-placeholder").classList.add("active");
		} else {
			element.appendChild(
				document.newElement({
					type: "img",
					class: "ajax-placeholder m-top10 m-bottom10 tt-loading-placeholder active",
					attributes: { src: "https://www.torn.com/images/v2/main/ajax-loader.gif" },
				})
			);
		}
	} else {
		element.find(".tt-loading-placeholder").classList.remove("active");
	}
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

function toSeconds(milliseconds) {
	if (!milliseconds) return toSeconds(Date.now());
	else if (typeof milliseconds === "object" && milliseconds instanceof Date) return toSeconds(milliseconds.getTime());
	else if (!isNaN(milliseconds)) return Math.trunc(milliseconds / 1000);
	else return toSeconds(Date.now());
}

function toMultipleDigits(number, digits = 2) {
	if (number === undefined) return undefined;
	return number.toString().length < digits ? toMultipleDigits(`0${number}`, digits) : number;
}

function formatTime(time = {}, attributes = {}) {
	time = {
		milliseconds: undefined,
		seconds: undefined,
		...time,
	};
	attributes = {
		type: "normal",
		showDays: false,
		hideHours: false,
		hideSeconds: false,
		...attributes,
	};

	switch (attributes.type) {
		case "timer":
			let date;
			if (isDefined(time.milliseconds)) date = new Date(time.milliseconds);
			else if (isDefined(time.seconds)) date = new Date(time.seconds * 1000);

			let parts = [];
			if (attributes.showDays) parts.push(Math.floor(date.getTime() / TO_MILLIS.DAYS));
			if (!attributes.hideHours) parts.push(date.getUTCHours());
			parts.push(date.getUTCMinutes());
			if (!attributes.hideSeconds) parts.push(date.getUTCSeconds());

			return parts.map((p) => toMultipleDigits(p, 2)).join(":");
		default:
			return -1;
	}
}

function isDefined(object) {
	return typeof object !== "undefined";
}
