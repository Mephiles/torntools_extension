const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;

const SCRIPT_TYPE = (() => {
	if (typeof window === "undefined" || window.location.href.endsWith("/_generated_background_page.html")) {
		return "BACKGROUND";
	} else if (chrome.action) {
		return "POPUP";
		// } else if (!chrome?.runtime?.onMessage) {
		// return "WEB";
	} else {
		return "CONTENT";
	}
})();

Object.defineProperty(Array.prototype, "insertAt", {
	value(index: number, ...elements: any[]) {
		this.splice(index, 0, ...elements);
	},
	enumerable: false,
});
Object.defineProperty(Array.prototype, "equals", {
	value(other: unknown[]) {
		if (!other) return false;

		if (this.length !== other.length) return false;

		for (let i = 0; i < this.length; i++) {
			if (Array.isArray(this[i]) && Array.isArray(other[i])) {
				if (!this[i].equals(other[i])) return false;
			} else if (this[i] instanceof Object && other[i] instanceof Object) {
				if (!this[i].equals(other[i])) return false;
			} else if (this[i] !== other[i]) {
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
			return this.reduce(
				(flat: unknown[], toFlatten: any) => flat.concat(Array.isArray(toFlatten) && depth > 1 ? toFlatten.flat(depth - 1) : toFlatten),
				[]
			);
		},
		enumerable: false,
	});

Object.defineProperty(Object.prototype, "equals", {
	value(other: object) {
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

JSON.isValid = (str) => {
	try {
		JSON.parse(str);
		return true;
	} catch {
		return false;
	}
};

function sleep(millis: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, millis));
}

const TO_MILLIS = {
	SECONDS: 1000,
	MINUTES: 1000 * 60,
	HOURS: 1000 * 60 * 60,
	DAYS: 1000 * 60 * 60 * 24,
};

/**
 * @deprecated Use findItemInObject instead.
 */
function findItemsInObject(object: any, attributes: any = {}, options: any = {}): unknown {
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

function findItemInObject<T>(object: { [key: string | number]: T }, attributes: object = {}): undefined | (T & { id: string }) {
	if (!object || Object.keys(attributes).length === 0) return undefined;

	for (const id in object) {
		const item = {
			id,
			...object[id],
		};
		if (!Object.keys(attributes).every((attribute) => item[attribute] === attributes[attribute])) continue;

		return item;
	}

	return undefined;
}

/**
 * @deprecated Use findItemInList instead.
 */
function findItemsInList(list: any[], attributes: any = {}, options: any = {}): unknown {
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

function findItemInList<T>(list: T[], attributes: object = {}): undefined | T {
	if (!list || list.length === 0) return undefined;

	for (const item of list) {
		if (!Object.keys(attributes).every((attribute) => item[attribute] === attributes[attribute])) continue;

		return item;
	}

	return undefined;
}

function isIntNumber(number: string | null): boolean {
	if (number === null) return false;

	const _number = parseFloat(number.toString());
	return !isNaN(_number) && isFinite(_number) && _number % 1 === 0;
}

function isSameUTCDay(date1: number | string | Date, date2: number | string | Date) {
	const _date1 = new Date(date1);
	const _date2 = new Date(date2);

	return _date1.setUTCHours(24, 0, 0, 0) === _date2.setUTCHours(24, 0, 0, 0);
}

function getUTCTodayAtTime(hours: number, minutes: number) {
	const date = new Date();
	date.setUTCHours(hours, minutes);

	return date;
}

function isToday(timestamp: number) {
	return new Date().getDate() === new Date(timestamp).getDate();
}

function getUUID() {
	return "_" + Math.random().toString(36).substr(2, 9);
}

function getCookie(cname: string) {
	const name = cname + "=";

	for (let cookie of decodeURIComponent(document.cookie).split(";")) {
		cookie = cookie.trimStart();

		if (cookie.includes(name)) {
			return cookie.substring(name.length);
		}
	}
	return "";
}

function getValue(x: any) {
	return typeof x === "function" ? x() : x;
}

async function getValueAsync(x: any) {
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

function toCorrectType(object: { [key: string]: any }) {
	object = { ...object };

	for (const key in object) {
		const value = object[key];
		if (!isNaN(value)) object[key] = parseFloat(value);
		else if (value === "true") object[key] = true;
		else if (value === "false") object[key] = false;
	}

	return object;
}

function toClipboard(text: string) {
	if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
		navigator.clipboard.writeText(text).then(() => {});
	} else {
		const textarea = elementBuilder({ type: "textarea", value: text, style: { position: "absolute", left: "-9999px" }, attributes: { readonly: "" } });
		document.body.appendChild(textarea);

		textarea.select();
		document.execCommand("copy");

		document.body.removeChild(textarea);
	}
}

function getTimeUntilNextJobUpdate() {
	const now = new Date().getTime();

	const nextJobUpdate = new Date();
	nextJobUpdate.setUTCHours(18);
	nextJobUpdate.setUTCMinutes(30);
	nextJobUpdate.setUTCSeconds(0);
	nextJobUpdate.setUTCMilliseconds(0);

	// If the current time is after 6:30 PM, add 1 day to the target time
	if (nextJobUpdate.getTime() <= now) {
		nextJobUpdate.setDate(nextJobUpdate.getDate() + 1);
	}

	return nextJobUpdate.getTime() - now;
}

function toNumericVersion(version: string) {
	return parseInt(
		version
			.split(".")
			.map((part) => part.padStart(3, "0"))
			.join("")
			.padEnd(9, "9")
	);
}

function calculateDatePeriod(startDate: Date, endDate: Date) {
	// Ensure endDate is not before startDate
	if (startDate > endDate) {
		[startDate, endDate] = [endDate, startDate]; // Swap if dates are in wrong order
	}

	// Create mutable copies of the dates to avoid modifying the originals
	const currentStartDate = new Date(startDate.getTime());
	const currentEndDate = new Date(endDate.getTime());

	// Increment years until adding another year would exceed the end date
	let years = 0;
	while (
		currentStartDate.getFullYear() + 1 <= currentEndDate.getFullYear() ||
		(currentStartDate.getFullYear() + 1 === currentEndDate.getFullYear() &&
			(currentStartDate.getMonth() < currentEndDate.getMonth() ||
				(currentStartDate.getMonth() === currentEndDate.getMonth() && currentStartDate.getDate() <= currentEndDate.getDate())))
	) {
		currentStartDate.setFullYear(currentStartDate.getFullYear() + 1);
		years++;
	}

	// Adjust currentStartDate back by one year if it overshot
	if (currentStartDate > currentEndDate && years > 0) {
		currentStartDate.setFullYear(currentStartDate.getFullYear() - 1);
		years--;
	}

	// Increment months until adding another month would exceed the end date
	let months = 0;
	while (currentStartDate.getMonth() < 11 || currentStartDate.getFullYear() < currentEndDate.getFullYear()) {
		let testDate = new Date(currentStartDate.getTime());
		testDate.setMonth(testDate.getMonth() + 1);

		if (testDate > currentEndDate) {
			break;
		}
		currentStartDate.setMonth(currentStartDate.getMonth() + 1);
		months++;
	}

	// Calculate days
	// The difference in milliseconds between the remaining dates
	const diffTime = Math.abs(currentEndDate.getTime() - currentStartDate.getTime());
	// Convert milliseconds to days
	const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

	return { years, months, days };
}

function toRecord<TItem, TValue, TKey extends string = string>(array: TItem[], fn: (item: TItem, index: number) => [TKey, TValue]): Record<TKey, TValue> {
	return array.reduce<Record<TKey, TValue>>(
		(record, item, index) => {
			const [key, value] = fn(item, index);
			record[key] = value;

			return record;
		},
		{} as Record<TKey, TValue>
	);
}

function groupBy<TItem, TValue>(array: TItem[], fn: (item: TItem, index: number) => [string, TValue]): Record<string, TValue[]> {
	return array.reduce<Record<string, TValue[]>>((record, item, index) => {
		const [key, value] = fn(item, index);
		record[key] = record[key] ?? [];
		record[key].push(value);

		return record;
	}, {});
}

/**
 * Like keyof but for keys with specific value.
 *
 * For example: `TypedKeyOf<{a: number; b: string}, string>` will yield `'b'`
 */
type TypedKeyOf<T, K> = { [P in keyof T]: T[P] extends K ? P : never }[keyof T];

function getTypedKeyOf<T, K>(item: T, typedKeyOf: TypedKeyOf<T, K>): K {
	return item[typedKeyOf] as K;
}

function isTabFocused() {
	return document.hasFocus();
}
