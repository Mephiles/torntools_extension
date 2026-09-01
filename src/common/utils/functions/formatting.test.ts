import { afterAll, beforeAll, describe, expect, it, setSystemTime } from "bun:test";
import {
	applyPlural,
	camelCase,
	capitalizeText,
	convertToNumber,
	daySuffix,
	dropDecimals,
	formatBytes,
	formatNumber,
	formatTime,
	roundNearest,
	textToTime,
	toMultipleDigits,
	toSeconds,
	withoutEndPunctuation,
} from "./formatting";

describe("formatting", () => {
	describe("convertToNumber", () => {
		it("should extract integers", () => {
			expect(convertToNumber("123")).toBe(123);
		});

		it("should extract negative integers", () => {
			expect(convertToNumber("-123")).toBe(-123);
		});

		it("should extract decimal numbers", () => {
			expect(convertToNumber("123.45")).toBe(123.45);
		});

		it("should extract negative decimal numbers", () => {
			expect(convertToNumber("-123.45")).toBe(-123.45);
		});

		it("should extract numbers from text", () => {
			expect(convertToNumber("abc 123 xyz")).toBe(123);
			expect(convertToNumber("Price: $12.99")).toBe(12.99);
		});

		it("should handle strings with multiple numbers (returns first match)", () => {
			expect(convertToNumber("123 and 456")).toBe(123);
		});

		it("should handle comma separated numbers", () => {
			expect(convertToNumber("1,234")).toBe(1234);
			expect(convertToNumber("1,234,567")).toBe(1234567);
			expect(convertToNumber("$1,234,567")).toBe(1234567);
		});

		it("should return NaN when no number is found", () => {
			expect(convertToNumber("abc")).toBeNaN();
			expect(convertToNumber("")).toBeNaN();
		});
	});

	describe("formatNumber", () => {
		it("should format number", () => {
			expect(formatNumber(123456789)).toBe("123,456,789");
		});

		it("should format number by rounding", () => {
			expect(formatNumber(1234.45)).toBe("1,234");
			expect(formatNumber(1234.56)).toBe("1,235");
			expect(formatNumber(1234567.89)).toBe("1,234,568");
		});

		it("should passthrough non-numeric strings", () => {
			expect(formatNumber("abc")).toBe("abc");
			expect(formatNumber("")).toBe("");
		});

		it("should parse numeric strings", () => {
			expect(formatNumber("1000")).toBe("1,000");
			expect(formatNumber("-1000")).toBe("-1,000");
			expect(formatNumber("1234.5")).toBe("1,235");
		});

		it("should return infinity symbol for positive infinity", () => {
			expect(formatNumber(Number.POSITIVE_INFINITY)).toBe("∞");
		});

		it("should apply decimals rounding when decimals is provided", () => {
			expect(formatNumber(1234.567, { decimals: 2 })).toBe("1,234.57");
			expect(formatNumber("1234.567", { decimals: 2 })).toBe("1,234.57");
			expect(formatNumber(1234.567, { decimals: 0 })).toBe("1,235");
		});

		it("should format currency", () => {
			expect(formatNumber(1234, { currency: true })).toBe("$1,234");
			expect(formatNumber(-1234, { currency: true })).toBe("-$1,234");
		});

		it("should support forcing operation sign", () => {
			expect(formatNumber(1234, { forceOperation: true })).toBe("+1,234");
			expect(formatNumber(-1234, { forceOperation: true })).toBe("-1,234");
		});

		it("should use custom formatter when provided", () => {
			const formatter = { format: (n: number) => `X${n}X` };
			expect(formatNumber(1234, { formatter })).toBe("X1234X");
			expect(formatNumber(1234.567, { decimals: 2, formatter })).toBe("X1234.57X");
		});

		it("should shorten numbers (v1) using k/mil/bill", () => {
			expect(formatNumber(1000, { shorten: true })).toBe("1k");
			expect(formatNumber(1_000_000, { shorten: true })).toBe("1mil");
			expect(formatNumber(1_000_000_000, { shorten: true })).toBe("1bill");
			expect(formatNumber(1_234_567, { shorten: true })).toBe("1.235mil");
		});

		it("should shorten numbers (v2) using k/m/b", () => {
			expect(formatNumber(1000, { shorten: 2 })).toBe("1k");
			expect(formatNumber(1_000_000, { shorten: 2 })).toBe("1m");
			expect(formatNumber(1_000_000_000, { shorten: 2 })).toBe("1b");
			expect(formatNumber(1_234_567, { shorten: 2 })).toBe("1.235m");
		});

		it("should shorten numbers (v3) with configurable decimals", () => {
			expect(formatNumber(1500, { shorten: 3, decimals: 2 })).toBe("1.5k");
			expect(formatNumber(1_234_567, { shorten: 3, decimals: 2 })).toBe("1.23m");
			expect(formatNumber(1_234_567_890, { shorten: 3, decimals: 2 })).toBe("1.23b");
		});

		it("should format roman numerals", () => {
			expect(formatNumber(0, { roman: true })).toBe("");
			expect(formatNumber(4, { roman: true })).toBe("IV");
			expect(formatNumber(9, { roman: true })).toBe("IX");
			expect(formatNumber(58, { roman: true })).toBe("LVIII");
			expect(formatNumber(1994, { roman: true })).toBe("MCMXCIV");
		});

		it("should throw for negative roman numerals", () => {
			expect(() => formatNumber(-1, { roman: true })).toThrow();
		});
	});

	describe("withoutEndPunctuation", () => {
		it("should remove punctuation at the end", () => {
			expect(withoutEndPunctuation("word!")).toBe("word");
			expect(withoutEndPunctuation("word.")).toBe("word");
			expect(withoutEndPunctuation("word?")).toBe("word");
			expect(withoutEndPunctuation("word,")).toBe("word");
			expect(withoutEndPunctuation("word;")).toBe("word");
		});

		it("should keep punctuation within", () => {
			expect(withoutEndPunctuation("wo.rd")).toBe("wo.rd");
			expect(withoutEndPunctuation("wo!rd")).toBe("wo!rd");
			expect(withoutEndPunctuation("wo?rd")).toBe("wo?rd");
		});

		it("should keep words without punctuation intact", () => {
			expect(withoutEndPunctuation("word")).toBe("word");
			expect(withoutEndPunctuation("1234")).toBe("1234");
		});
	});

	describe("formatTime", () => {
		const NOW = new Date("2026-08-12T12:00:00Z");
		const DAY = 86_400_000;

		beforeAll(() => {
			setSystemTime(NOW);
		});

		afterAll(() => {
			setSystemTime();
		});

		describe("type 'ago'", () => {
			const at = (date: string) => formatTime({ milliseconds: new Date(date).getTime() }, { type: "ago" });

			it('should format a date in a previous calendar year (~12 months ago) as "12 months ago"', () => {
				expect(at("2025-08-11T12:00:00Z")).toBe("12 months ago");
			});

			it('should format a date in a previous calendar year (~19 months ago) as "1 year ago"', () => {
				expect(at("2025-01-15T12:00:00Z")).toBe("1 year ago");
			});

			it('should format a date ~2.5 years ago as "2 years ago"', () => {
				expect(at("2024-01-15T12:00:00Z")).toBe("2 years ago");
			});

			it('should format a date one month ago as "1 month ago"', () => {
				expect(at("2026-07-12T12:00:00Z")).toBe("1 month ago");
			});

			it('should format a date ~11 months ago as "11 months ago"', () => {
				expect(at("2025-08-21T12:00:00Z")).toBe("11 months ago");
			});

			it('should format a date one day ago as "1 day ago"', () => {
				expect(at(new Date(NOW.getTime() - DAY).toISOString())).toBe("1 day ago");
			});

			it('should format a date two days ago as "2 days ago"', () => {
				expect(at(new Date(NOW.getTime() - 2 * DAY).toISOString())).toBe("2 days ago");
			});

			it('should format a date three hours ago as "3 hours ago"', () => {
				expect(at(new Date(NOW.getTime() - 3 * 3_600_000).toISOString())).toBe("3 hours ago");
			});

			it('should format a future date as "from now"', () => {
				expect(at(new Date(NOW.getTime() + 3 * DAY).toISOString())).toBe("3 days from now");
			});

			it("should use short units when short is set", () => {
				expect(formatTime({ milliseconds: new Date("2025-01-15T12:00:00Z").getTime() }, { type: "ago", short: true })).toBe("1 y ago");
				expect(formatTime({ milliseconds: NOW.getTime() - 3 * 3_600_000 }, { type: "ago", short: true })).toBe("3 hrs ago");
			});
		});
	});

	describe("dropDecimals", () => {
		it("should truncate decimals towards zero", () => {
			expect(dropDecimals(1.9)).toBe(1);
			expect(dropDecimals(-1.9)).toBe(-1);
			expect(dropDecimals(0.5)).toBe(0);
			expect(dropDecimals(123.456)).toBe(123);
		});
	});

	describe("roundNearest", () => {
		it("should round to the nearest multiple", () => {
			expect(roundNearest(5, 10)).toBe(10);
			expect(roundNearest(4, 10)).toBe(0);
			expect(roundNearest(7, 5)).toBe(5);
			expect(roundNearest(3, 5)).toBe(5);
			expect(roundNearest(15, 10)).toBe(20);
		});
	});

	describe("camelCase", () => {
		it("should convert text to lower camel case", () => {
			expect(camelCase("Hello World")).toBe("helloWorld");
			expect(camelCase("hello world")).toBe("helloworld");
		});

		it("should convert text to upper camel case when lowerCamelCase is false", () => {
			expect(camelCase("Hello World", false)).toBe("HelloWorld");
		});

		it("should remove all spaces", () => {
			expect(camelCase("multi   word text")).toBe("multiwordtext");
		});
	});

	describe("toSeconds", () => {
		it("should truncate milliseconds to seconds", () => {
			expect(toSeconds(1500)).toBe(1);
			expect(toSeconds(3000)).toBe(3);
			expect(toSeconds(1234)).toBe(1);
			expect(toSeconds(-1000)).toBe(-1);
		});

		it("should accept Date objects", () => {
			expect(toSeconds(new Date(5000))).toBe(5);
		});
	});

	describe("textToTime", () => {
		it("should parse hh:mm as hours and minutes", () => {
			expect(textToTime("1:30")).toBe(5_400_000);
		});

		it("should parse mm:ss when short is set", () => {
			expect(textToTime("1:30", { short: true })).toBe(90_000);
		});

		it("should parse hh:mm:ss", () => {
			expect(textToTime("1:02:03")).toBe(3_723_000);
		});

		it("should parse dd:hh:mm:ss", () => {
			expect(textToTime("1:00:00:05")).toBe(86_405_000);
		});

		it("should parse labeled units", () => {
			expect(textToTime("1d 2h")).toBe(93_600_000);
			expect(textToTime("5min")).toBe(300_000);
			expect(textToTime("30s")).toBe(30_000);
			expect(textToTime("1h 30min 45s")).toBe(5_445_000);
		});
	});

	describe("toMultipleDigits", () => {
		it("should pad numbers to at least two digits", () => {
			expect(toMultipleDigits(5)).toBe("05");
			expect(toMultipleDigits(12)).toBe("12");
			expect(toMultipleDigits(123)).toBe("123");
			expect(toMultipleDigits("7")).toBe("07");
		});

		it("should respect a custom digit count", () => {
			expect(toMultipleDigits(5, 3)).toBe("005");
		});

		it("should return undefined for undefined input", () => {
			expect(toMultipleDigits(undefined)).toBeUndefined();
		});
	});

	describe("capitalizeText", () => {
		it("should capitalize the first character only", () => {
			expect(capitalizeText("hello")).toBe("Hello");
			expect(capitalizeText("hello world")).toBe("Hello world");
		});

		it("should capitalize every word when everyWord is set", () => {
			expect(capitalizeText("hello world", { everyWord: true })).toBe("Hello World");
		});
	});

	describe("applyPlural", () => {
		it("should return an empty string for exactly one", () => {
			expect(applyPlural(1)).toBe("");
		});

		it("should return 's' otherwise", () => {
			expect(applyPlural(2)).toBe("s");
			expect(applyPlural(0)).toBe("s");
			expect(applyPlural(11)).toBe("s");
		});
	});

	describe("daySuffix", () => {
		it("should add the correct ordinal suffix", () => {
			expect(daySuffix(1)).toBe("1st");
			expect(daySuffix(2)).toBe("2nd");
			expect(daySuffix(3)).toBe("3rd");
			expect(daySuffix(4)).toBe("4th");
			expect(daySuffix(11)).toBe("11th");
			expect(daySuffix(12)).toBe("12th");
			expect(daySuffix(13)).toBe("13th");
			expect(daySuffix(21)).toBe("21st");
			expect(daySuffix(22)).toBe("22nd");
			expect(daySuffix(23)).toBe("23rd");
			expect(daySuffix(31)).toBe("31st");
		});
	});

	describe("formatBytes", () => {
		it("should format zero bytes", () => {
			expect(formatBytes(0)).toBe("0 bytes");
		});

		it("should format bytes without a unit bump", () => {
			expect(formatBytes(500)).toBe("500 bytes");
		});

		it("should bump units at 1024 boundaries", () => {
			expect(formatBytes(1024)).toBe("1 KB");
			expect(formatBytes(1536)).toBe("1.5 KB");
			expect(formatBytes(1048576)).toBe("1 MB");
		});

		it("should respect the decimals option", () => {
			expect(formatBytes(1536, { decimals: 0 })).toBe("2 KB");
		});

		it("should throw for negative bytes", () => {
			expect(() => formatBytes(-1)).toThrow();
		});
	});

	describe("formatTime wordTimer", () => {
		it("should format days, hours, minutes and seconds", () => {
			expect(formatTime({ milliseconds: 93_784_000 }, { type: "wordTimer", showDays: true })).toBe("1 day 2 hours 3 minutes and 4 seconds");
		});

		it("should use extra short units", () => {
			expect(formatTime({ milliseconds: 93_784_000 }, { type: "wordTimer", showDays: true, extraShort: true })).toBe("1d 2h 3m 4s");
		});

		it("should use short units", () => {
			expect(formatTime({ milliseconds: 93_784_000 }, { type: "wordTimer", showDays: true, short: true })).toBe("1 day 2 hrs 3 mins and 4 secs");
		});

		it("should hide seconds when hideSeconds is set", () => {
			expect(formatTime({ milliseconds: 7_384_000 }, { type: "wordTimer", hideSeconds: true })).toBe("2 hours and 3 minutes");
		});

		it("should skip days when showDays is not set", () => {
			expect(formatTime({ milliseconds: 7_384_000 }, { type: "wordTimer" })).toBe("2 hours 3 minutes and 4 seconds");
		});

		it("should truncate seconds when a larger unit is shown", () => {
			expect(formatTime({ milliseconds: 86_402_000 }, { type: "wordTimer", showDays: true, truncateSeconds: true })).toBe("1 day");
		});
	});
});
