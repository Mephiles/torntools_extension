/// <reference types="vitest/globals" />

describe("String#getNumber", () => {
	it("should extract integers", () => {
		expect("123".getNumber()).toBe(123);
	});

	it("should extract negative integers", () => {
		expect("-123".getNumber()).toBe(-123);
	});

	it("should extract decimal numbers", () => {
		expect("123.45".getNumber()).toBe(123.45);
	});

	it("should extract negative decimal numbers", () => {
		expect("-123.45".getNumber()).toBe(-123.45);
	});

	it("should extract numbers from text", () => {
		expect("abc 123 xyz".getNumber()).toBe(123);
		expect("Price: $12.99".getNumber()).toBe(12.99);
	});

	it("should handle strings with multiple numbers (returns first match)", () => {
		expect("123 and 456".getNumber()).toBe(123);
	});

	it("should handle comma separated numbers", () => {
		expect("1,234".getNumber()).toBe(1234);
		expect("1,234,567".getNumber()).toBe(1234567);
		expect("$1,234,567".getNumber()).toBe(1234567);
	});

	it("should return NaN when no number is found", () => {
		expect("abc".getNumber()).toBeNaN();
		expect("".getNumber()).toBeNaN();
	});
});

describe("formatNumber", () => {
	it("should format number", () => {
		expect(formatNumber(123456789)).toBe("123,456,789");
	});

	it("should format decimals without inserting commas into the fractional part", () => {
		expect(formatNumber(1234.56)).toBe("1,234.56");
		expect(formatNumber(1234567.89)).toBe("1,234,567.89");
	});

	it("should passthrough non-numeric strings", () => {
		expect(formatNumber("abc")).toBe("abc");
		expect(formatNumber("" as any)).toBe("");
	});

	it("should parse numeric strings", () => {
		expect(formatNumber("1000")).toBe("1,000");
		expect(formatNumber("-1000")).toBe("-1,000");
		expect(formatNumber("1234.5")).toBe("1,234.5");
	});

	it("should return infinity symbol for positive infinity", () => {
		expect(formatNumber(Number.POSITIVE_INFINITY)).toBe("∞");
	});

	it("should apply decimals rounding when decimals is provided", () => {
		expect(formatNumber(1234.567, { decimals: 2 })).toBe("1,234.57");
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
		// v1 only shortens some non-exact values (e.g. >= 1e6 and >= 1e9)
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
