"use strict";

const REGEXES = {
	getNumber: /\D/g,
	formatNumber: /\B(?=(\d{3})+(?!\d))/g,
};

Number.prototype.dropDecimals = function () {
	return parseInt(this.toString());
};
Number.prototype.roundNearest = function (multiple) {
	return Math.round(this / multiple) * multiple;
};

String.prototype.camelCase = function (lowerCamelCase) {
	return (this.trim().charAt(0)[lowerCamelCase ? "toLowerCase" : "toUpperCase"]() + this.slice(1)).trim().replaceAll(" ", "");
};

String.prototype.getNumber = function () {
	return parseInt(this.replace(REGEXES.getNumber, "")) || 0;
};

function toSeconds(milliseconds) {
	if (!milliseconds) return toSeconds(Date.now());
	else if (typeof milliseconds === "object" && milliseconds instanceof Date) return toSeconds(milliseconds.getTime());
	else if (!isNaN(milliseconds)) return Math.trunc(milliseconds / 1000);
	else return toSeconds(Date.now());
}

function textToTime(time, options = {}) {
	options = {
		short: false,
		...options,
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
		let group;
		// noinspection JSUnusedAssignment
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

function toMultipleDigits(number, digits = 2) {
	if (number === undefined) return undefined;
	return number.toString().length < digits ? toMultipleDigits(`0${number}`, digits) : number;
}

function formatTime(time = {}, options = {}) {
	if (typeof time === "number") return formatTime({ milliseconds: time }, options);
	else if (time instanceof Date) return formatTime({ milliseconds: time.getTime() }, options);

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
		daysToHours: false,
		...options,
	};

	let millis = 0;
	if (isDefined(time.milliseconds)) millis += time.milliseconds;
	if (isDefined(time.seconds)) millis += time.seconds * TO_MILLIS.SECONDS;

	let date, parts;
	switch (options.type) {
		case "normal":
			date = new Date(millis);

			let seconds, minutes, hours;
			if (settings.formatting.tct) {
				seconds = date.getUTCSeconds();
				minutes = date.getUTCMinutes();
				hours = date.getUTCHours();
			} else {
				seconds = date.getSeconds();
				minutes = date.getMinutes();
				hours = date.getHours();
			}

			seconds = options.hideSeconds ? false : toMultipleDigits(seconds);
			minutes = toMultipleDigits(minutes);
			hours = toMultipleDigits(hours);

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
			if (!options.hideHours) parts.push(date.getUTCHours() + (options.daysToHours ? 24 * Math.floor(millis / TO_MILLIS.DAYS) : 0));
			parts.push(date.getUTCMinutes());
			if (!options.hideSeconds) parts.push(date.getUTCSeconds());

			let timerText = parts.map((p) => toMultipleDigits(p, 2)).join(":");
			if (options.short && options.showDays && timerText.startsWith("00:")) timerText = timerText.slice(3);

			return timerText;
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

			return timeAgo;
		default:
			return -1;
	}
}

function formatDate(date = {}, options = {}) {
	if (typeof date === "number") return formatDate({ milliseconds: date }, options);
	else if (date instanceof Date) return formatDate({ milliseconds: date.getTime() }, options);

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

	let day, month, year;
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
	let separator;
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

function formatNumber(number, options = {}) {
	options = {
		shorten: false,
		formatter: false,
		decimals: -1,
		currency: false,
		forceOperation: false,
		roman: false,
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
		return options.formatter.format(number);
	}

	if (options.roman) {
		if (number === 0) return "";
		else if (number < 0) throw "Roman numbers can only be positive!";

		const ROMAN = [
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

		function toRoman(number) {
			// eslint-disable-line no-inner-declarations
			if (number === 0) return "";

			for (const [value, character] of ROMAN) {
				if (number < value) continue;

				return character + toRoman(number - value);
			}
		}
	}

	const abstract = Math.abs(number);
	const operation = number < 0 ? "-" : options.forceOperation ? "+" : "";
	let text;

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

function applyPlural(check) {
	return check !== 1 ? "s" : "";
}

function daySuffix(number) {
	const last = number % 10,
		double = number % 100;

	if (last === 1 && double !== 11) return number + "st";
	else if (last === 2 && double !== 12) return number + "nd";
	else if (last === 3 && double !== 13) return number + "rd";
	else return number + "th";
}
