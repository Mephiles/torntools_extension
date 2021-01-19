"use strict";

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

Document.prototype.newElement = function (options = {}) {
	if (typeof options == "string") {
		return this.createElement(options);
	} else if (typeof options == "object") {
		options = {
			type: "div",
			id: false,
			class: false,
			text: false,
			html: false,
			value: false,
			href: false,
			children: [],
			attributes: {},
			events: {},
			style: {},
			...options,
		};

		let newElement = this.createElement(options.type);

		if (options.id) newElement.id = options.id;
		if (options.class) newElement.setAttribute("class", options.class);
		if (options.text) newElement.innerText = options.text;
		if (options.html) newElement.innerHTML = options.html;
		if (options.value) {
			if (typeof options.value === "function") newElement.value = options.value();
			else newElement.value = options.value;
		}
		if (options.href) newElement.href = options.href;

		for (let child of options.children || []) {
			if (typeof child === "string") {
				newElement.appendChild(document.createTextNode(child));
			} else {
				newElement.appendChild(child);
			}
		}

		if (options.attributes) {
			let attributes = options.attributes;
			if (typeof attributes === "function") attributes = attributes();

			for (let attribute in attributes) newElement.setAttribute(attribute, attributes[attribute]);
		}
		for (let event in options.events) newElement.addEventListener(event, options.events[event]);

		for (let key in options.style) newElement.style[key] = options.style[key];
		for (let key in options.dataset) newElement.dataset[key] = options.dataset[key];

		return newElement;
	}
};

Array.prototype.last = function () {
	return this[this.length - 1];
};
Array.prototype.insertAt = function (index, ...elements) {
	this.splice(index, 0, ...elements);
};

Number.prototype.dropDecimals = function () {
	return parseInt(this.toString());
};

String.prototype.camelCase = function (lowerCamelCase) {
	return (this.trim().charAt(0)[lowerCamelCase ? "toLowerCase" : "toUpperCase"]() + this.slice(1)).trim().replaceAll(" ", "");
};

DOMTokenList.prototype.contains = function (className) {
	const classes = [...this];
	if (className.startsWith("^=")) {
		className = className.substring(2, className.length);

		for (const name of classes) {
			if (!name.startsWith(className)) continue;

			return true;
		}
		return false;
	} else {
		return classes.includes(className);
	}
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

function getHashParameters() {
	let hash = window.location.hash;

	if (hash.startsWith("#/")) hash = hash.substring(2);
	else if (hash.startsWith("#") || hash.startsWith("/")) hash = hash.substring(1);

	if (!hash.startsWith("!")) hash = "?" + hash;

	return new URLSearchParams(hash);
}

function getUUID() {
	return "_" + Math.random().toString(36).substr(2, 9);
}

function rotateElement(element, degrees) {
	let uuid;
	if (element.hasAttribute("rotate-id")) uuid = element.getAttribute("rotate-id");
	else {
		uuid = getUUID();
		element.setAttribute("rotate-id", uuid);
	}

	if (rotatingElements[uuid]) {
		clearInterval(rotatingElements[uuid].interval);
		element.style.transform = `rotate(${rotatingElements[uuid].totalDegrees}deg)`;
	}

	let startDegrees = (element.style.transform ? parseInt(element.style.transform.replace("rotate(", "").replace("deg)", "")) : 0) % 360;
	element.style.transform = `rotate(${startDegrees}deg)`;

	const totalDegrees = startDegrees + degrees;
	const step = 1000 / degrees;

	rotatingElements[uuid] = {
		interval: setInterval(function () {
			const currentRotation = element.style.transform ? parseInt(element.style.transform.replace("rotate(", "").replace("deg)", "")) : 0;
			let newRotation = currentRotation + step;

			if (currentRotation < totalDegrees && newRotation > totalDegrees) {
				newRotation = totalDegrees;
				clearInterval(rotatingElements[uuid].interval);
			}

			element.style.transform = `rotate(${newRotation}deg)`;
		}, 1),
		totalDegrees,
	};
}

function requireCondition(condition, options = {}) {
	options = {
		delay: 10,
		maxCycles: -1,
		...options,
	};

	return new Promise((resolve, reject) => {
		if (checkCondition()) return;

		let counter = 0;
		let checker = setInterval(() => {
			if (checkCounter(counter++) || checkCondition()) return clearInterval(checker);
		}, options.delay);

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
			if (options.maxCycles <= 0) return false;

			if (count > options.maxCycles) {
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
	return requireElement(".box-title, .title-black[role=heading], .title-black > div[role=heading], .travel-agency-travelling");
}

function hasParent(element, options = {}) {
	options = {
		class: false,
		id: false,
		...options,
	};

	if (!element.parentElement) return false;

	if (options.class && element.parentElement.classList.contains(options.class)) return true;
	if (options.id && element.parentElement.id === options.id) return true;

	return hasParent(element.parentElement, options);
}

function findParent(element, options = {}) {
	options = {
		tag: false,
		class: false,
		id: false,
		hasAttribute: false,
		...options,
	};

	if (!element || !element.parentElement) return undefined;

	if (options.tag && element.parentElement.tagName === options.tag) return element.parentElement;
	if (options.class && element.parentElement.classList.contains(options.class)) return element.parentElement;
	if (options.hasAttribute && element.parentElement.getAttribute(options.hasAttribute) !== null) return element.parentElement;

	return findParent(element.parentElement, options);
}

function checkMobile() {
	return new Promise((resolve) => {
		if (typeof mobile === "boolean") return resolve(mobile);

		if (document.readyState === "complete" || document.readyState === "interactive") check();
		else window.addEventListener("DOMContentLoaded", check);

		function check() {
			mobile = window.innerWidth <= 600;

			resolve(mobile);
		}
	});
}

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

			if (location === "torn") {
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

async function setBadge(type, options = {}) {
	options = {
		events: 0,
		messages: 0,
		...options,
	};

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

function isSameStockTick(date1, date2) {
	return (
		(date1.getUTCMinutes() / 15).dropDecimals() === (date2.getUTCMinutes() / 15).dropDecimals() &&
		date1.getUTCHours() === date2.getUTCHours() &&
		date1.getUTCDate() === date2.getUTCDate() &&
		date1.getUTCMonth() === date2.getUTCMonth() &&
		date1.getUTCFullYear() === date2.getUTCFullYear()
	);
}

function showLoadingPlaceholder(element, show) {
	if (show) {
		if (element.find(".tt-loading-placeholder")) {
			element.find(".tt-loading-placeholder").classList.add("active");
		} else {
			element.appendChild(
				document.newElement({
					type: "img",
					class: "ajax-placeholder mt10 mb10 tt-loading-placeholder active",
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

function formatTime(time = {}, options = {}) {
	if (typeof time === "number") return formatTime({ milliseconds: time, attributes: options });

	time = {
		milliseconds: undefined,
		seconds: undefined,
		...time,
	};
	options = {
		type: "normal",
		showDays: false,
		hideHours: false,
		hideSeconds: false,
		short: false,
		extraShort: false,
		agoFilter: false,
		...options,
	};

	let millis = 0;
	if (isDefined(time.milliseconds)) millis += time.milliseconds;
	if (isDefined(time.seconds)) millis += time.seconds * TO_MILLIS.SECONDS;

	let date;
	let parts;
	switch (options.type) {
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
			if (options.showDays) parts.push(Math.floor(date.getTime() / TO_MILLIS.DAYS));
			if (!options.hideHours) parts.push(date.getUTCHours());
			parts.push(date.getUTCMinutes());
			if (!options.hideSeconds) parts.push(date.getUTCSeconds());

			return parts.map((p) => toMultipleDigits(p, 2)).join(":");
		case "wordTimer":
			date = new Date(millis);

			parts = [];
			if (options.showDays && (date.getTime() / TO_MILLIS.DAYS).dropDecimals() > 0)
				parts.push(formatUnit(Math.floor(date.getTime() / TO_MILLIS.DAYS), { normal: "day", short: "day", extraShort: "d" }));
			if (!options.hideHours && date.getUTCHours()) parts.push(formatUnit(date.getUTCHours(), { normal: "hour", short: "hr", extraShort: "h" }));
			if (date.getUTCMinutes()) parts.push(formatUnit(date.getUTCMinutes(), { normal: "minute", short: "min", extraShort: "m" }));
			if (!options.hideSeconds && date.getUTCSeconds()) parts.push(formatUnit(date.getUTCSeconds(), { normal: "second", short: "sec", extraShort: "s" }));

			if (parts.length > 1 && !options.extraShort) {
				parts.insertAt(parts.length - 1, "and");
			}

			function formatUnit(amount, unit) {
				let formatted = `${amount}`;

				if (options.extraShort) {
					formatted += unit.extraShort;
				} else if (options.short) {
					formatted += ` ${unit.short}${applyPlural(amount)}`;
				} else {
					formatted += ` ${unit.normal}${applyPlural(amount)}`;
				}

				return formatted;
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

			let _units = UNITS;
			if (options.agoFilter) _units = UNITS.filter((value) => value.millis <= options.agoFilter);

			for (let unit of _units) {
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

function formatDate(date = {}, options = {}) {
	if (typeof date === "number") return formatDate({ milliseconds: date, attributes: options });

	date = {
		milliseconds: undefined,
		...date,
	};
	options = {
		showYear: false,
		...options,
	};

	let millis = 0;
	if (isDefined(date.milliseconds)) millis += date.milliseconds;
	if (isDefined(date.seconds)) millis += date.seconds * TO_MILLIS.SECONDS;

	const _date = new Date(millis);
	let parts = [];
	let separator;

	switch (settings.formatting.date) {
		case "us":
			separator = "/";

			parts.push(_date.getMonth() + 1, _date.getDate());
			if (options.showYear) parts.push(_date.getFullYear());
			break;
		case "iso":
			separator = "-";

			if (options.showYear) parts.push(_date.getFullYear());
			parts.push(_date.getMonth() + 1, _date.getDate());
			break;
		case "eu":
		default:
			separator = ".";

			parts.push(_date.getDate(), _date.getMonth() + 1);
			if (options.showYear) parts.push(_date.getFullYear());
			break;
	}

	return parts.map((p) => toMultipleDigits(p)).join(separator);
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

function formatNumber(number, options = {}) {
	options = {
		shorten: false,
		formatter: false,
		decimals: -1,
		...options,
	};
	if (typeof number !== "number") {
		if (isNaN(number)) return number;
		else number = parseFloat(number);
	}

	if (options.decimals !== -1) {
		number = options.decimals === 0 ? parseInt(number) : parseFloat(number.toFixed(options.decimals));
	}

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

function capitalizeText(text, options = {}) {
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
	if (!torndata || !torndata.items) return true;

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
	return check !== 1 ? "s" : "";
}

function sortTable(table, columnPlace, order) {
	let header = table.find(`th:nth-child(${columnPlace})`);
	if (order) {
		if (header.find("i")) {
			switch (order) {
				case "asc":
					header.find("i.fa-caret-down").classList.add("fa-caret-up");
					header.find("i.fa-caret-down").classList.remove("fa-caret-down");
					break;
				case "desc":
					header.find("i.fa-caret-up").classList.add("fa-caret-down");
					header.find("i.fa-caret-up").classList.remove("fa-caret-up");
					break;
				case "none":
				default:
					header.find("i").remove();
					break;
			}
		} else {
			switch (order) {
				case "asc":
					header.appendChild(document.newElement({ type: "i", class: "fas fa-caret-up" }));
					break;
				case "desc":
					header.appendChild(document.newElement({ type: "i", class: "fas fa-caret-down" }));
					break;
			}
		}
	} else if (header.find("i.fa-caret-down")) {
		header.find("i.fa-caret-down").classList.add("fa-caret-up");
		header.find("i.fa-caret-down").classList.remove("fa-caret-down");

		order = "asc";
	} else if (header.find("i.fa-caret-up") || order === "desc") {
		header.find("i.fa-caret-up").classList.add("fa-caret-down");
		header.find("i.fa-caret-up").classList.remove("fa-caret-up");

		order = "desc";
	} else {
		header.appendChild(document.newElement({ type: "i", class: "fas fa-caret-up" }));

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
			elementA = elementA.find(`*:nth-child(${columnPlace})`);
			elementB = elementB.find(`*:nth-child(${columnPlace})`);

			let valueA, valueB;
			if (elementA.hasAttribute("sort-type")) {
				switch (elementA.getAttribute("sort-type")) {
					case "date":
						valueA = elementA.getAttribute("value");
						valueB = elementB.getAttribute("value");

						if (Date.parse(valueA)) valueA = Date.parse(valueA);
						if (Date.parse(valueB)) valueA = Date.parse(valueB);
						break;
					case "css-dataset":
						valueA =
							elementA.dataset[
								getComputedStyle(elementA)
									.getPropertyValue("--currentValue")
									.match(/attr\(data-(.*)\)/i)[1]
							];
						valueB =
							elementB.dataset[
								getComputedStyle(elementB)
									.getPropertyValue("--currentValue")
									.match(/attr\(data-(.*)\)/i)[1]
							];
						break;
					default:
						console.warn("Attempting to sort by a non-existing type.", elementA.getAttribute("sort-type"));
						return;
				}
			} else if (elementA.hasAttribute("value")) {
				valueA = elementA.getAttribute("value");
				valueB = elementB.getAttribute("value");
			} else {
				valueA = elementA.innerText;
				valueB = elementB.innerText;
			}

			let a, b;
			if (isNaN(parseFloat(valueA))) {
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

function hasAPIData() {
	return api.torn.key && !api.torn.error && userdata && Object.keys(userdata).length;
}

function injectXHR() {
	if (injectedXHR) return;

	document.find("head").appendChild(
		document.newElement({
			type: "script",
			attributes: { type: "text/javascript", src: chrome.runtime.getURL("/scripts/global/xhr.inject.js") },
		})
	);
	injectedXHR = true;
}

function addXHRListener(callback) {
	injectXHR();

	window.addEventListener("tt-xhr", callback);
}

function injectFetch() {
	if (injectedFetch) return;

	document.find("head").appendChild(
		document.newElement({
			type: "script",
			attributes: { type: "text/javascript", src: chrome.runtime.getURL("/scripts/global/fetch.inject.js") },
		})
	);
	injectedFetch = true;
}

function addFetchListener(callback) {
	injectFetch();

	window.addEventListener("tt-fetch", callback);
}

function createContainer(title, options = {}) {
	options = {
		id: title.camelCase(true),
		parentElement: false,
		nextElement: false,
		previousElement: false,
		showHeader: true,
		collapsible: true,
		applyRounding: true,
		spacer: false,
		contentBackground: true,
		allowDragging: false,
		...options,
	};

	const container = _createContainer(title, options);

	let parentElement;
	if (options.parentElement) parentElement = options.parentElement;
	else if (options.nextElement) parentElement = options.nextElement.parentElement;
	else if (options.previousElement) parentElement = options.previousElement.parentElement;
	else throw new Error("Not yet supported!");

	if (options.nextElement) parentElement.insertBefore(container, options.nextElement);
	else if (options.previousElement) parentElement.insertBefore(container, options.previousElement.nextSibling);
	else parentElement.appendChild(container);

	return { container, content: container.find(".content"), options: container.find(".options") };

	function _createContainer(title, options = {}) {
		if (document.find(`#${options.id}`)) document.find(`#${options.id}`).remove();

		let containerClasses = ["tt-container"];
		if (options.collapsible) containerClasses.push("collapsible");
		if (options.applyRounding) containerClasses.push("rounding");
		if (options.spacer) containerClasses.push("spacer");

		const theme = THEMES[settings.themes.containers];
		containerClasses.push(theme.containerClass);
		const container = document.newElement({ type: "div", class: containerClasses.join(" "), id: options.id });

		const collapsed = options.collapsible && (options.id in filters.containers ? filters.containers[options.id] : false);

		let html = "";
		if (options.showHeader)
			html += `
				<div class="title ${collapsed ? "collapsed" : ""}">
					<div class="text">${title}</div>
					<div class="options"></div>
					${options.collapsible ? '<i class="icon fas fa-caret-down"/>' : ""}
				</div>`;
		html += `<div class="content ${options.contentBackground ? "background" : ""}"></div>`;
		container.innerHTML = html;

		if (options.collapsible) {
			container.find(".title").addEventListener("click", async () => {
				container.find(".title").classList.toggle("collapsed");

				await ttStorage.change({ filters: { containers: { [options.id]: container.find(".title").classList.contains("collapsed") } } });
			});
		}
		if (options.allowDragging) {
			let content = container.find(".content");
			content.addEventListener("dragover", (event) => event.preventDefault());
			content.addEventListener("drop", (event) => {
				content.find(".temp.item").classList.remove("temp");
				container.find(".content").style.maxHeight = container.find(".content").scrollHeight + "px";

				// Firefox opens new tab when dropping item
				event.preventDefault();
				event.dataTransfer.clearData();
			});
			content.addEventListener("dragenter", () => {
				if (content.find(".temp.item")) {
					content.find(".temp.item").style.opacity = "1";
				}
			});
			content.addEventListener("dragleave", () => {
				if (content.find(".temp.item")) {
					content.find(".temp.item").style.opacity = "0.2";
				}
			});
		}

		return container;
	}
}

function findContainer(title, options = {}) {
	options = {
		id: title.camelCase(true),
		selector: false,
		...options,
	};

	if (!options.id) return false;

	const container = document.find(`#${options.id}`);
	if (!container) return false;

	if (options.selector) return container.find(options.selector);
	else return container;
}

function removeContainer(title, options = {}) {
	const container = findContainer(title, options);
	if (!container) return;

	container.remove();
}

function findItemsInObject(object, attributes = {}, options = {}) {
	options = {
		single: false,
		...options,
	};

	let items = [];
	if (!object || Object.keys(attributes).length === 0) return options.single ? false : items;

	for (let id in object) {
		const item = {
			id,
			...object[id],
		};
		if (!Object.keys(attributes).every((attribute) => item[attribute] === attributes[attribute])) continue;

		if (options.single) return item;

		items.push(item);
	}

	return options.single ? false : items;
}

function findItemsInList(list, attributes = {}, options = {}) {
	options = {
		single: false,
		...options,
	};

	let items = [];
	if (!list || list.length === 0) return options.single ? false : items;

	for (let item of list) {
		if (!Object.keys(attributes).every((attribute) => item[attribute] === attributes[attribute])) continue;

		if (options.single) return item;

		items.push(item);
	}

	return options.single ? false : items;
}

function isFlying() {
	return document.body.dataset.traveling === "true" || document.body.dataset.traveling === true;
}

function isAbroad() {
	return document.body.dataset.abroad === "true" || document.body.dataset.abroad === true;
}

function getCookie(cname) {
	const name = cname + "=";

	for (let cookie of decodeURIComponent(document.cookie).split(";")) {
		cookie = cookie.trimLeft();

		if (cookie.includes(name)) {
			return cookie.substring(name.length);
		}
	}
	return "";
}

function getRFC() {
	const rfc = getCookie("rfc_v");
	if (!rfc) {
		for (let cookie of document.cookie.split("; ")) {
			cookie = cookie.split("=");
			if (cookie[0] === "rfc_v") {
				return cookie[1];
			}
		}
	}
	return rfc;
}

function addRFC(url) {
	url = url || "";
	url += (url.split("?").length > 1 ? "&" : "?") + "rfcv=" + getRFC();
	return url;
}

// TODO - Use in ttItems.js
const ITEM_VALUE_UTILITIES = {
	showTotal: (list, type) => {
		if (!hasAPIData() || !settings.apiUsage.user.inventory) return;

		let total;
		if (type === "All") total = userdata.inventory.map((x) => x.quantity * x.market_price).reduce((a, b) => (a += b), 0);
		else
			total = userdata.inventory
				.filter((x) => x.type === type)
				.map((x) => x.quantity * x.market_price)
				.reduce((a, b) => (a += b), 0);

		setTimeout(() => {
			list.insertBefore(
				document.newElement({
					type: "li",
					class: "tt-ignore",
					children: [
						document.newElement({
							type: "li",
							text: `Total Value: $${formatNumber(total, { decimals: 0 })}`,
							class: "tt-item-price",
						}),
					],
				}),
				list.firstElementChild
			);
		}, 0);
	},
	removeTotal: () => {
		const total = document.find(".tt-ignore .tt-item-price");
		if (total) total.parentElement.remove();
	},
	addValue: (priceElement, quantity, price) => {
		const totalPrice = quantity * price;
		if (totalPrice) {
			if (quantity > 1) {
				priceElement.appendChild(document.newElement({ type: "span", text: `$${formatNumber(price)} | ` }));
				priceElement.appendChild(document.newElement({ type: "span", text: `${quantity}x = `, class: "tt-item-quantity" }));
			}
			priceElement.appendChild(document.newElement({ type: "span", text: `$${formatNumber(totalPrice)}` }));
		} else if (price === 0) {
			priceElement.innerText = `N/A`;
		} else {
			priceElement.innerText = `$${formatNumber(price)}`;
		}
	},
	INVENTORY: {
		showValues: async (type, items) => {
			ITEM_VALUE_UTILITIES.removeTotal();

			if (settings.pages.items.values) {
				const list = ITEM_VALUE_UTILITIES.INVENTORY.getItemCurrentList();

				if (type) ITEM_VALUE_UTILITIES.showTotal(list, type);

				for (const item of items) {
					if (parseInt(item.untradable)) continue;

					requireElement(`li[data-reactid*='$${item.armoryID}'] .name-wrap`, { parent: list }).then(async () => {
						const itemRow = list.find(`li[data-reactid*='$${item.armoryID}']`);

						const parent = itemRow.find(".name-wrap");
						if (parent.find(".tt-item-price")) {
							if (type) return;
							else parent.find(".tt-item-price").remove();
						}

						const price = parseInt(item.averageprice) || 0;
						const quantity = parseInt(item.Qty) || 1;

						const valueWrap = itemRow.find(".info-wrap");
						if (valueWrap && (!valueWrap.innerText.trim() || valueWrap.innerText.startsWith("$"))) {
							valueWrap.innerHTML = "";
							valueWrap.classList.add("tt-item-price-color");
							ITEM_VALUE_UTILITIES.addValue(valueWrap, quantity, price);
						} else {
							const priceElement = document.newElement({ type: "span", class: "tt-item-price" });
							if (item.groupItem && quantity !== 1) priceElement.style.setProperty("padding-right", "98px", "important");

							ITEM_VALUE_UTILITIES.addValue(priceElement, quantity, price);

							if (item.groupItem) {
								if (quantity === 1) parent.insertAdjacentElement("afterend", priceElement);
								else parent.appendChild(priceElement);
							} else parent.insertAdjacentElement("afterend", priceElement);
						}
					});
				}
			} else {
				for (const price of document.findAll(".tt-item-price, #category-wrap .tt-ignore")) {
					price.remove();
				}
			}
		},
		getItemCurrentList: () => {
			return document.find(".category-wrap ul.items-cont[style*='display:block;'], .category-wrap ul.items-cont[style*='display: block;']");
		},
		addListener: () => {
			addXHRListener(({ detail: { page, xhr, json } }) => {
				if (page === "inventory") {
					console.log("DKK xhr");
					ITEM_VALUE_UTILITIES.INVENTORY.handleInventoryRequest(xhr, json);
				}
			});
		},
		handleInventoryRequest: (xhr, json) => {
			const params = new URLSearchParams(xhr.requestBody);

			const step = params.get("step");
			switch (step) {
				case "getList":
				case "getListById":
					ITEM_VALUE_UTILITIES.INVENTORY.showValues(params.get("type") || false, json.list).catch((error) =>
						console.error("Couldn't show the item values.", error)
					);
					break;
			}
		},
	},
};
