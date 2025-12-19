const REGEXES = {
	getNumber: /\D/g,
	formatNumber: /\B(?=(\d{3})+(?!\d))/g,
};

interface Number {
	dropDecimals(): number;
	roundNearest(multiple: number): number;
}

Number.prototype.dropDecimals = function () {
	return parseInt(this.toString());
};
Number.prototype.roundNearest = function (multiple: number) {
	return Math.round((this as number) / multiple) * multiple;
};

interface String {
	camelCase(lowerCamelCase: boolean): string;
	getNumber(): number;
}

String.prototype.camelCase = function (lowerCamelCase) {
	return (this.trim().charAt(0)[lowerCamelCase ? "toLowerCase" : "toUpperCase"]() + this.slice(1)).trim().replaceAll(" ", "");
};

String.prototype.getNumber = function () {
	return parseInt(this.replace(REGEXES.getNumber, "")) || 0;
};

function toSeconds(milliseconds: any) {
	if (!milliseconds) return toSeconds(Date.now());
	else if (typeof milliseconds === "object" && milliseconds instanceof Date) return toSeconds(milliseconds.getTime());
	else if (!isNaN(milliseconds)) return Math.trunc(milliseconds / 1000);
	else return toSeconds(Date.now());
}

interface TimeTextOptions {
	short: boolean;
}

function textToTime(time: string, partialOptions: Partial<TimeTextOptions> = {}) {
	const options = {
		short: false,
		...partialOptions,
	};

	let millis = 0;

	if (time.includes(":")) {
		const parts = time.split(":");

		if (parts.length === 2) {
			if (options.short) {
				millis += parseInt(parts[0]) * TO_MILLIS.MINUTES;
				millis += parseInt(parts[1]) * TO_MILLIS.SECONDS;
			} else {
				millis += parseInt(parts[0]) * TO_MILLIS.HOURS;
				millis += parseInt(parts[1]) * TO_MILLIS.MINUTES;
			}
		} else if (parts.length === 3) {
			millis += parseInt(parts[0]) * TO_MILLIS.HOURS;
			millis += parseInt(parts[1]) * TO_MILLIS.MINUTES;
			millis += parseInt(parts[2]) * TO_MILLIS.SECONDS;
		} else if (parts.length === 4) {
			millis += parseInt(parts[0]) * TO_MILLIS.DAYS;
			millis += parseInt(parts[1]) * TO_MILLIS.HOURS;
			millis += parseInt(parts[2]) * TO_MILLIS.MINUTES;
			millis += parseInt(parts[3]) * TO_MILLIS.SECONDS;
		}
	} else {
		let group: RegExpMatchArray | null;
		if ((group = time.match(/(\d+) ?d/i))) {
			millis += parseInt(group[1]) * TO_MILLIS.DAYS;
		}
		if ((group = time.match(/(\d+) ?h/i))) {
			millis += parseInt(group[1]) * TO_MILLIS.HOURS;
		}
		if ((group = time.match(/(\d+) ?min/i))) {
			millis += parseInt(group[1]) * TO_MILLIS.MINUTES;
		}
		if ((group = time.match(/(\d+) ?s/i))) {
			millis += parseInt(group[1]) * TO_MILLIS.SECONDS;
		}
	}

	return millis;
}

function toMultipleDigits(number: undefined, digits?: number): undefined;
function toMultipleDigits(number: number | string, digits?: number): string;
function toMultipleDigits(number: undefined | number | string, digits: number = 2): string | undefined {
	if (number === undefined) return undefined;
	return number.toString().length < digits ? toMultipleDigits(`0${number}`, digits) : number.toString();
}

type DateObject = number | Date | { milliseconds: number } | { seconds: number };

interface FormatTimeOptions {
	type: "normal" | "timer" | "wordTimer" | "ago";
	showDays: boolean;
	hideHours: boolean;
	hideSeconds: boolean;
	short: boolean;
	extraShort: boolean;
	agoFilter: undefined | number;
	daysToHours: boolean;
	truncateSeconds: boolean;
}

function formatTime(time: DateObject, partialOptions: Partial<FormatTimeOptions> = {}): string {
	if (typeof time === "number") return formatTime({ milliseconds: time }, partialOptions);
	else if (time instanceof Date) return formatTime({ milliseconds: time.getTime() }, partialOptions);

	const options: FormatTimeOptions = {
		type: "normal",
		showDays: false,
		hideHours: false,
		hideSeconds: false,
		short: false,
		extraShort: false,
		agoFilter: undefined,
		daysToHours: false,
		truncateSeconds: false,
		...partialOptions,
	};

	let millis: number;
	if ("milliseconds" in time) millis = time.milliseconds;
	else if ("seconds" in time) millis = time.seconds * TO_MILLIS.SECONDS;

	let date: Date, parts: number[];
	switch (options.type) {
		case "normal":
			date = new Date(millis);

			let seconds: string | number | undefined, minutes: string | number, hours: string | number;
			if (settings.formatting.tct) {
				seconds = date.getUTCSeconds();
				minutes = date.getUTCMinutes();
				hours = date.getUTCHours();
			} else {
				seconds = date.getSeconds();
				minutes = date.getMinutes();
				hours = date.getHours();
			}

			const secondsText = options.hideSeconds ? undefined : toMultipleDigits(seconds);
			const minutesText = toMultipleDigits(minutes);
			let hoursText = toMultipleDigits(hours);

			switch (settings.formatting.time) {
				case "us":
					const afternoon = hours >= 12;
					hoursText = toMultipleDigits(hours % 12 || 12);

					return secondsText
						? `${hoursText}:${minutesText}:${secondsText} ${afternoon ? "PM" : "AM"}`
						: `${hoursText}:${minutesText} ${afternoon ? "PM" : "AM"}`;
				case "eu":
				default:
					return secondsText ? `${hoursText}:${minutesText}:${secondsText}` : `${hoursText}:${minutesText}`;
			}
		case "timer":
			date = new Date(millis);

			parts = [];
			if (options.showDays) parts.push(Math.floor(date.getTime() / TO_MILLIS.DAYS));
			if (!options.hideHours) parts.push(date.getUTCHours() + (options.daysToHours ? 24 * Math.floor(millis / TO_MILLIS.DAYS) : 0));
			parts.push(date.getUTCMinutes());
			if (!options.hideSeconds) parts.push(date.getUTCSeconds());

			let timerText = parts.map((p) => toMultipleDigits(p, 2)).join(":");
			if (options.short && options.showDays && timerText.startsWith("00:")) timerText = timerText.slice(3);

			return timerText;
		case "wordTimer":
			return formatTimeAsWordTimer(millis, options);
		case "ago":
			let timeAgo = Math.floor(Date.now() - millis);

			let token = "ago";
			if (timeAgo < 0) {
				token = "from now";
				timeAgo = Math.abs(timeAgo);
			}

			const UNITS = [
				{
					unit: options.short ? "y" : "year",
					millis: TO_MILLIS.DAYS * 370,
					getter: () => {
						const to = new Date();
						const from = new Date(millis);

						let years = to.getFullYear() - from.getFullYear();
						if (to.getMonth() > from.getMonth() || (to.getMonth() === from.getMonth() && to.getDay() > from.getDay())) years--;

						return years;
					},
				},
				{
					unit: options.short ? "mth" : "month",
					millis: TO_MILLIS.DAYS * 30,
					getter: () => {
						const to = new Date();
						const from = new Date(millis);

						let months = (to.getFullYear() - from.getFullYear()) * 12;
						months += to.getMonth() - from.getMonth();
						if (to.getDay() > from.getDay()) months--;

						return months;
					},
				},
				{ unit: options.short ? "d" : "day", millis: TO_MILLIS.DAYS },
				{ unit: options.short ? "hr" : "hour", millis: TO_MILLIS.HOURS },
				{ unit: options.short ? "min" : "minute", millis: TO_MILLIS.MINUTES },
				{ unit: options.short ? "sec" : "second", millis: TO_MILLIS.SECONDS },
				{ text: options.short ? "now" : "just now", millis: 0 },
			];

			let _units = UNITS;
			if (options.agoFilter) _units = UNITS.filter((value) => value.millis <= options.agoFilter);

			for (const unit of _units) {
				if (timeAgo < unit.millis) continue;

				if (unit.unit) {
					const amount = unit.getter ? unit.getter() : Math.floor(timeAgo / unit.millis);

					return `${amount} ${unit.unit}${applyPlural(amount)} ${token}`;
				} else if (unit.text) {
					return unit.text;
				}
			}

			return timeAgo.toString();
		default:
			throw new Error("Invalid formatTime type.");
	}
}

interface FormattableUnit {
	normal: string;
	short: string;
	extraShort: string;
}

function formatTimeAsWordTimer(millis: number, options: FormatTimeOptions) {
	const date = new Date(millis);

	let hasShownDays = false;
	let hasShownHours = false;

	const parts: string[] = [];
	if (options.showDays && (date.getTime() / TO_MILLIS.DAYS).dropDecimals() > 0) {
		hasShownDays = true;
		parts.push(formatUnit(Math.floor(date.getTime() / TO_MILLIS.DAYS), { normal: "day", short: "day", extraShort: "d" }));
	}
	if (!options.hideHours && date.getUTCHours()) {
		hasShownHours = true;
		parts.push(formatUnit(date.getUTCHours(), { normal: "hour", short: "hr", extraShort: "h" }));
	}
	if (date.getUTCMinutes()) parts.push(formatUnit(date.getUTCMinutes(), { normal: "minute", short: "min", extraShort: "m" }));

	if (!options.hideSeconds && date.getUTCSeconds() && (!options.truncateSeconds || !(hasShownDays || hasShownHours)))
		parts.push(formatUnit(date.getUTCSeconds(), { normal: "second", short: "sec", extraShort: "s" }));

	if (parts.length > 1 && !options.extraShort) {
		parts.insertAt(parts.length - 1, "and");
	}

	function formatUnit(amount: number, unit: FormattableUnit) {
		// eslint-disable-line no-inner-declarations
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
}

interface FormatDateOptions {
	showYear: boolean;
}

function formatDate(date: DateObject, partialOptions: Partial<FormatDateOptions> = {}) {
	if (typeof date === "number") return formatDate({ milliseconds: date }, partialOptions);
	else if (date instanceof Date) return formatDate({ milliseconds: date.getTime() }, partialOptions);

	const options: FormatDateOptions = {
		showYear: false,
		...partialOptions,
	};

	let millis: number;
	if ("milliseconds" in date) millis = date.milliseconds;
	else if ("seconds" in date) millis = date.seconds * 1000;

	const _date = new Date(millis);

	let day: number, month: number, year: number;
	if (settings.formatting.tct) {
		day = _date.getUTCDate();
		month = _date.getUTCMonth() + 1;
		year = _date.getUTCFullYear();
	} else {
		day = _date.getDate();
		month = _date.getMonth() + 1;
		year = _date.getFullYear();
	}

	const parts = [];
	let separator: string;
	switch (settings.formatting.date) {
		case "us":
			separator = "/";

			parts.push(month, day);
			if (options.showYear) parts.push(year);
			break;
		case "iso":
			separator = "-";

			if (options.showYear) parts.push(year);
			parts.push(month, day);
			break;
		case "eu":
		default:
			separator = ".";

			parts.push(day, month);
			if (options.showYear) parts.push(year);
			break;
	}

	return parts.map((p) => toMultipleDigits(p)).join(separator);
}

interface FormatNumberOptions {
	shorten: boolean | 1 | 2 | 3;
	formatter: undefined | { format(number: number): string };
	decimals: undefined | number;
	currency: boolean;
	forceOperation: boolean;
	roman: boolean;
}

function formatNumber(number: number | string, partialOptions: Partial<FormatNumberOptions> = {}): string {
	const options: FormatNumberOptions = {
		shorten: false,
		formatter: undefined,
		decimals: undefined,
		currency: false,
		forceOperation: false,
		roman: false,
		...partialOptions,
	};
	if (typeof number !== "number") {
		if (isNaN(parseInt(number))) return number;
		else number = parseFloat(number);
	}

	if (number === Number.POSITIVE_INFINITY) {
		return "∞";
	}

	if (options.decimals !== undefined) {
		number = options.decimals === 0 ? parseInt(number.toString()) : parseFloat(number.toFixed(options.decimals));
	}

	if (options.formatter) {
		return options.formatter.format(number);
	}

	if (options.roman) {
		if (number === 0) return "";
		else if (number < 0) throw "Roman numbers can only be positive!";

		const ROMAN: [number, string][] = [
			[1000, "M"],
			[900, "CM"],
			[500, "D"],
			[400, "CD"],
			[100, "C"],
			[90, "XC"],
			[50, "L"],
			[40, "XL"],
			[10, "X"],
			[9, "IX"],
			[5, "V"],
			[4, "IV"],
			[1, "I"],
		];

		return toRoman(number);

		function toRoman(number: number): string {
			if (number === 0) return "";

			for (const [value, character] of ROMAN) {
				if (number < value) continue;

				return character + toRoman(number - value);
			}
			return "N/A";
		}
	}

	const abstract = Math.abs(number);
	const operation = number < 0 ? "-" : options.forceOperation ? "+" : "";
	let text: string;

	if (options.shorten) {
		const version = options.shorten === true ? 1 : options.shorten;
		const decimals = options.decimals !== -1 ? options.decimals : 3;

		const words = (() => {
			switch (version) {
				default:
				case 1:
					return {
						thousand: "k",
						million: "mil",
						billion: "bill",
					};
				case 2:
				case 3:
					return {
						thousand: "k",
						million: "m",
						billion: "b",
					};
			}
		})();

		if (version === 1 || version === 2) {
			if (abstract >= 1e9) {
				if (abstract % 1e9 === 0) text = (abstract / 1e9).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + words.billion;
				else text = (abstract / 1e9).toFixed(3) + words.billion;
			} else if (abstract >= 1e6) {
				if (abstract % 1e6 === 0) text = abstract / 1e6 + words.million;
				else text = (abstract / 1e6).toFixed(3) + words.million;
			} else if (abstract >= 1e3) {
				if (abstract % 1e3 === 0) text = abstract / 1e3 + words.thousand;
			}
		} else {
			if (abstract >= 1e9) {
				if (abstract % 1e9 === 0) text = abstract / 1e9 + words.billion;
				else text = parseFloat((abstract / 1e9).toFixed(decimals)) + words.billion;
			} else if (abstract >= 1e6) {
				if (abstract % 1e6 === 0) text = abstract / 1e6 + words.million;
				else text = parseFloat((abstract / 1e6).toFixed(decimals)) + words.million;
			} else if (abstract >= 1e3) {
				if (abstract % 1e3 === 0) text = abstract / 1e3 + words.thousand;
				else if (abstract % 100 === 0) {
					text = abstract / 1e3 + words.thousand;
				}
			}
		}
	}

	if (!text) text = abstract.toString().replace(REGEXES.formatNumber, ",");

	return `${operation}${options.currency ? "$" : ""}${text}`;
}

interface CapitalizeTextOptions {
	everyWord: boolean;
}

function capitalizeText(text: string, partialOptions: Partial<CapitalizeTextOptions> = {}): string {
	const options: CapitalizeTextOptions = {
		everyWord: false,
		...partialOptions,
	};

	if (!options.everyWord) return text[0].toUpperCase() + text.slice(1);

	return text
		.trim()
		.split(" ")
		.map((word) => capitalizeText(word))
		.join(" ")
		.trim();
}

function applyPlural(check: number): string {
	return check !== 1 ? "s" : "";
}

function daySuffix(number: number): string {
	const last = number % 10,
		double = number % 100;

	if (last === 1 && double !== 11) return number + "st";
	else if (last === 2 && double !== 12) return number + "nd";
	else if (last === 3 && double !== 13) return number + "rd";
	else return number + "th";
}
