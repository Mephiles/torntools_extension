"use strict";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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

JSON.isValid = (str) => {
	try {
		JSON.parse(str);
		return true;
	} catch {
		return false;
	}
};

function sleep(millis) {
	return new Promise((resolve) => setTimeout(resolve, millis));
}

const TO_MILLIS = {
	SECONDS: 1000,
	MINUTES: 1000 * 60,
	HOURS: 1000 * 60 * 60,
	DAYS: 1000 * 60 * 60 * 24,
};

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

function isDefined(object) {
	return typeof object !== "undefined";
}

function isSameUTCDay(date1, date2) {
	return date1.setUTCHours(24, 0, 0, 0) === date2.setUTCHours(24, 0, 0, 0);
}

function getUUID() {
	return "_" + Math.random().toString(36).substr(2, 9);
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
