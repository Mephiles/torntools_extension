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

Array.prototype.last = function () {
	return this[this.length - 1];
};

Array.prototype.insertAt = function (index, ...elements) {
	this.splice(index, 0, ...elements);
};

if (!Array.prototype.flat)
	Object.defineProperty(Array.prototype, "flat", {
		value(depth = 1) {
			return this.reduce((flat, toFlatten) => flat.concat(Array.isArray(toFlatten) && depth > 1 ? toFlatten.flat(depth - 1) : toFlatten), []);
		},
	});

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

	if (attributes.tag && element.parentElement.tagName === attributes.tag) return element.parentElement;
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
			tornstats: "https://www.tornstats.com/",
			torntools: "https://torntools.gregork.com/",
			nukefamily: "https://www.nukefamily.org/",
		};

		let url, path;
		let params = new URLSearchParams();
		switch (location) {
			case "torn":
				url = PLATFORMS.torn;

				path = `${options.section}/${options.id || ""}`;

				params.append("selections", options.selections.join(","));
				params.append("key", options.key || api.torn.key);
				break;
			case "tornstats":
				url = PLATFORMS.tornstats;
				path = "api.php";

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

		async function handleError(result, silent) {
			if (location === "torn") {
				let error, online;

				error = result.error.error;
				online = result.error.code !== 9;

				if (!silent) {
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

async function setBadge(type, options) {
	const TYPES = {
		default: { text: "" },
		error: { text: "error", color: "#FF0000" },
		count: {
			text: async () => {
				if (options.events && options.messages) return `${options.events}/${options.messages}`;
				else if (options.events) return options.events.toString();
				else if (options.messages) return options.messages.toString();
				else return (await getBadgeText()) === "error" ? "error" : false;
			},
			color: async () => {
				if (options.events && options.messages) return "#1ed2ac";
				else if (options.events) return "#009eda";
				else if (options.messages) return "#84af03";
				else return (await getBadgeText()) === "error" ? "error" : false;
			},
		},
	};

	const badge = TYPES[type];
	if (typeof badge.text === "function") badge.text = await badge.text();
	if (typeof badge.color === "function") badge.color = await badge.color();
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
	if (typeof time === "number") return formatTime({ milliseconds: time, attributes });

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

	let millis = 0;
	if (isDefined(time.milliseconds)) millis += time.milliseconds;
	if (isDefined(time.seconds)) millis += time.seconds * TO_MILLIS.SECONDS;

	let date;
	let parts;
	switch (attributes.type) {
		case "normal":
			date = new Date(millis);

			let hours = toMultipleDigits(date.getHours());
			let minutes = toMultipleDigits(date.getMinutes());
			let seconds = toMultipleDigits(date.getSeconds());

			switch (settings.formatting.time) {
				case "us":
					const afternoon = hours >= 12;
					hours = toMultipleDigits(hours % 12 || 12);

					return seconds ? `${hours}:${minutes}:${seconds} ${afternoon ? "PM" : "AM"}` : `${hours}:${minutes} ${afternoon ? "PM" : "AM"}`;
				case "eu":
				default:
					return seconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
			}
		case "timer":
			date = new Date(millis);

			parts = [];
			if (attributes.showDays) parts.push(Math.floor(date.getTime() / TO_MILLIS.DAYS));
			if (!attributes.hideHours) parts.push(date.getUTCHours());
			parts.push(date.getUTCMinutes());
			if (!attributes.hideSeconds) parts.push(date.getUTCSeconds());

			return parts.map((p) => toMultipleDigits(p, 2)).join(":");
		case "wordTimer":
			date = new Date(millis);

			parts = [];
			if (attributes.showDays) parts.push(Math.floor(date.getTime() / TO_MILLIS.DAYS));
			if (!attributes.hideHours && date.getUTCHours()) parts.push(`${date.getUTCHours()} hour${applyPlural(date.getUTCHours())}`);
			if (date.getUTCMinutes()) parts.push(`${date.getUTCMinutes()} minute${applyPlural(date.getUTCMinutes())}`);
			if (!attributes.hideSeconds && date) parts.push(`${date.getUTCSeconds()} second${applyPlural(date.getUTCSeconds())}`);

			if (parts.length > 1) {
				parts.insertAt(parts.length - 1, "and");
			}

			return parts.join(" ");
		case "ago":
			let timeAgo = Date.now() - millis;

			let token = "ago";
			if (timeAgo < 0) {
				token = "from now";
				timeAgo = Math.abs(timeAgo);
			}

			const UNITS = [
				{ unit: "day", millis: TO_MILLIS.DAYS },
				{ unit: "hour", millis: TO_MILLIS.HOURS },
				{ unit: "minute", millis: TO_MILLIS.MINUTES },
				{ unit: "second", millis: TO_MILLIS.SECONDS },
				{ text: "just now", millis: 0 },
			];

			for (let unit of UNITS) {
				if (timeAgo < unit.millis) continue;

				if (unit.unit) {
					let amount = Math.floor(timeAgo / unit.millis);

					return `${amount} ${unit.unit}${amount > 1 ? "s" : ""} ${token}`;
				} else if (unit.text) {
					return unit.text;
				}
			}

			return timeAgo;
		default:
			return -1;
	}
}

function isDefined(object) {
	return typeof object !== "undefined";
}

function getNextChainBonus(current) {
	return CHAIN_BONUSES.find((bonus) => bonus > current);
}

function getNotificationSound(type) {
	return new Promise((resolve) => {
		switch (type) {
			case "1":
			case "2":
			case "3":
			case "4":
			case "5":
				return resolve(`resources/audio/notification${type}.wav`);
			case "custom":
				return resolve(settings.notifications.soundCustom);
			default:
				return resolve(false);
		}
	});
}

function getAudioPlayer() {
	const audioPlayer = new Audio();
	audioPlayer.autoplay = false;
	// noinspection JSValidateTypes
	audioPlayer.preload = true;

	return audioPlayer;
}

function usingChrome() {
	return navigator.userAgent.includes("Chrome");
}

function usingFirefox() {
	return navigator.userAgent.includes("Firefox");
}

function usingYandex() {
	return navigator.userAgent.includes("YaBrowser");
}

function formatNumber(number, options) {
	options = {
		shorten: false,
		formatter: false,
		...options,
	};

	if (options.formatter) {
		return formatter.format(number);
	}

	if (options.shorten) {
		let words;
		if (options.shorten === true || options.shorten === 1) {
			words = {
				thousand: "k",
				million: "mil",
				billion: "bill",
			};
		} else {
			words = {
				thousand: "k",
				million: "m",
				billion: "b",
			};
		}

		if (Math.abs(number) >= 1e9) {
			if (Math.abs(number) % 1e9 === 0) return (number / 1e9).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + words.billion;
			else return (number / 1e9).toFixed(3) + words.billion;
		} else if (Math.abs(number) >= 1e6) {
			if (Math.abs(number) % 1e6 === 0) return number / 1e6 + words.million;
			else return (number / 1e6).toFixed(3) + words.million;
		} else if (Math.abs(number) >= 1e3) {
			if (Math.abs(number) % 1e3 === 0) return number / 1e3 + words.thousand;
		}
	}

	return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function capitalizeText(text, options) {
	options = {
		everyWord: false,
		...options,
	};

	if (!options.everyWord) return text[0].toUpperCase() + text.slice(1);

	return text
		.trim()
		.split(" ")
		.map((word) => capitalizeText(word))
		.join(" ")
		.trim();
}

function isSellable(id) {
	const item = torndata.items[id];

	return (
		item &&
		!["Book", "Unused"].includes(item.type) &&
		![
			373, // Parcel
			374, // Present
			375, // Present
			376, // Present
			820, // Piggy Bank
			920, // Halloween Basket
			1003, // Halloween Basket
			1004, // Halloween Basket
			1005, // Halloween Basket
			1006, // Halloween Basket
			1007, // Halloween Basket
			1008, // Halloween Basket
			1009, // Halloween Basket
			1010, // Halloween Basket
			1011, // Halloween Basket
		].includes(item.id)
	);
}

function getPageTheme() {
	let theme = settings.themes.pages;

	// noinspection JSIncompatibleTypesComparison
	if (theme === "default") {
		if (window.matchMedia) return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
		return "light";
	}

	return theme;
}

function applyPlural(check) {
	return check !== 1 ? "s" : "s";
}

function sortTable(table, columnPlace) {
	let order;

	let header = table.find(`th:nth-child(${columnPlace})`);
	if (header.find("i.fa-caret-down")) {
		header.find("i.fa-caret-down").classList.add("fa-caret-up");
		header.find("i.fa-caret-down").classList.remove("fa-caret-down");

		order = "asc";
	} else if (header.find("i.fa-caret-up")) {
		header.find("i.fa-caret-up").classList.add("fa-caret-down");
		header.find("i.fa-caret-up").classList.remove("fa-caret-up");

		order = "desc";
	} else {
		header.appendChild(
			document.newElement({
				type: "i",
				class: "fas fa-caret-up",
			})
		);

		order = "asc";
	}
	for (let h of table.findAll("th")) {
		if (h === header) continue;

		if (h.find("i")) h.find("i").remove();
	}

	let rows;
	if (!table.find("tr:not(.heading)")) rows = [];
	else {
		rows = [...table.findAll("tr:not(.header)")];
		rows = sortRows(rows);
	}

	for (let row of rows) table.appendChild(row);

	function sortRows(rows) {
		if (order === "asc") {
			rows.sort((a, b) => {
				const helper = sortHelper(a, b);

				return helper.a - helper.b;
			});
		} else if (order === "desc") {
			rows.sort((a, b) => {
				const helper = sortHelper(a, b);

				return helper.b - helper.a;
			});
		}

		return rows;

		function sortHelper(elementA, elementB) {
			let isDate = false;
			let valueA, valueB;
			if (elementA.find(`*:nth-child(${columnPlace})`).hasAttribute("value")) {
				valueA = elementA.find(`*:nth-child(${columnPlace})`).getAttribute("value");
				valueB = elementB.find(`*:nth-child(${columnPlace})`).getAttribute("value");

				isDate = elementA.find(`*:nth-child(${columnPlace})`).getAttribute("type") === "date";
			} else {
				valueA = [...elementA.children][columnPlace - 1].innerText;
				valueB = [...elementB.children][columnPlace - 1].innerText;
			}

			let a, b;
			if (isDate && Date.parse(valueA) && Date.parse(valueB)) {
				a = Date.parse(valueA);
				b = Date.parse(valueB);
			} else if (isNaN(parseFloat(valueA))) {
				if (valueA.indexOf("$") > -1) {
					a = parseFloat(valueA.replace("$", "").replace(/,/g, ""));
					b = parseFloat(valueB.replace("$", "").replace(/,/g, ""));
				} else {
					a = valueA.toLowerCase().localeCompare(valueB.toLowerCase());
					b = 0;
				}
			} else {
				a = parseFloat(valueA);
				b = parseFloat(valueB);
			}

			return { a, b };
		}
	}
}
