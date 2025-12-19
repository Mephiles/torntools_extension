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
