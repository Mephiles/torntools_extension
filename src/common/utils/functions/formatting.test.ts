import { afterAll, beforeAll, describe, expect, it, setSystemTime } from "bun:test";
import { convertToNumber, formatNumber, formatTime, withoutEndPunctuation } from "./formatting";

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
});
