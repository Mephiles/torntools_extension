"use strict";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

Object.defineProperty(Array.prototype, "last", {
	value() {
		return this[this.length - 1];
	},
	enumerable: false,
});
Object.defineProperty(Array.prototype, "insertAt", {
	value(index, ...elements) {
		this.splice(index, 0, ...elements);
	},
	enumerable: false,
});
Object.defineProperty(Array.prototype, "totalSum", {
	value() {
		return this.reduce((a, b) => (a += b), 0);
	},
	enumerable: false,
});
Object.defineProperty(Array.prototype, "equals", {
	value(other) {
		if (!other) return false;

		if (this.length !== other.length) return false;

		for (let i = 0; i < this.length; i++) {
			if (Array.isArray(this[i]) && Array.isArray(other[i])) {
				if (!this[i].equals(other[i])) return false;
			} else if (this[i] instanceof Object && other[i] instanceof Object) {
				if (!this[i].equals(other[i])) return false;
			} else if (this[i] !== other[i]) {
				console.log("DKK array equals", { a: this[i], b: other[i] });
				return false;
			}
		}
		return true;
	},
	enumerable: false,
});

if (!Array.prototype.flat)
	Object.defineProperty(Array.prototype, "flat", {
		value(depth = 1) {
			return this.reduce((flat, toFlatten) => flat.concat(Array.isArray(toFlatten) && depth > 1 ? toFlatten.flat(depth - 1) : toFlatten), []);
		},
		enumerable: false,
	});

Object.defineProperty(Object.prototype, "equals", {
	value(other) {
		for (const property in this) {
			if (this.hasOwnProperty(property) !== other.hasOwnProperty(property)) return false;
			else if (typeof this[property] !== typeof other[property]) return false;
		}
		for (const property in other) {
			if (this.hasOwnProperty(property) !== other.hasOwnProperty(property)) return false;
			else if (typeof this[property] !== typeof other[property]) return false;

			if (!this.hasOwnProperty(property)) continue;

			if (Array.isArray(this[property]) && Array.isArray(other[property])) {
				if (!this[property].equals(other[property])) return false;
			} else if (this[property] instanceof Object && this[property] instanceof Object) {
				if (!this[property].equals(other[property])) return false;
			} else if (this[property] !== other[property]) return false;
		}

		return true;
	},
	enumerable: false,
});

// Object.prototype.equals = function (other) {
// 	for (const property in this) {
// 		if (this.hasOwnProperty(property) !== other.hasOwnProperty(property)) return false;
// 		else if (typeof this[property] !== typeof other[property]) return false;
// 	}
// 	for (const property in other) {
// 		if (this.hasOwnProperty(property) !== other.hasOwnProperty(property)) return false;
// 		else if (typeof this[property] !== typeof other[property]) return false;
//
// 		if (!this.hasOwnProperty(property)) continue;
//
// 		if (Array.isArray(this[property]) && Array.isArray(other[property])) {
// 			if (!this[property].equals(other[property])) return false;
// 		} else if (this[property] instanceof Object && this[property] instanceof Object) {
// 			if (!this[property].equals(other[property])) return false;
// 		} else if (this[property] !== other[property]) return false;
// 	}
//
// 	return true;
// };

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

	const items = [];
	if (!object || Object.keys(attributes).length === 0) return options.single ? false : items;

	for (const id in object) {
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

	const items = [];
	if (!list || list.length === 0) return options.single ? false : items;

	for (const item of list) {
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

function getValue(x) {
	return typeof x === "function" ? x() : x;
}

async function getValueAsync(x) {
	if (typeof x === "function") {
		if (x.constructor.name === "AsyncFunction") return await x();
		else {
			const value = x();

			if (value instanceof Promise) return await value;
			else return value;
		}
	}

	return x;
}
