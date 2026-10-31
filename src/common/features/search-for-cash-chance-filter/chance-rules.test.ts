import { describe, expect, it } from "bun:test";
import { parseChance, shouldDisable } from "./chance-rules";

describe("parseChance", () => {
	it("reads the percentage from the chance label", () => {
		expect(parseChance("Trash Collection: Mondays 06:00 - 18:00 (57%)")).toBe(57);
		expect(parseChance("Status: On-Peak (55%)")).toBe(55);
		expect(parseChance("Collections: 1st of the month 13:00 - 16:00 (100%)")).toBe(100);
		expect(parseChance("Tide: Mid-tide (9%)")).toBe(9);
	});

	it("returns null when there is no percentage to read", () => {
		expect(parseChance(undefined)).toBeNull();
		expect(parseChance(null)).toBeNull();
		expect(parseChance("")).toBeNull();
		expect(parseChance("Status: On-Peak")).toBeNull();
		expect(parseChance("(55%) but not at the end (57%)")).toBe(57);
	});

	it("returns null for a percentage outside the 0-100 range", () => {
		expect(parseChance("Status: On-Peak (150%)")).toBeNull();
	});
});

describe("shouldDisable", () => {
	it("disables nothing without a minimum", () => {
		expect(shouldDisable(10, 0)).toBe(false);
		expect(shouldDisable(10, -5)).toBe(false);
	});

	it("keeps places on or above the minimum", () => {
		expect(shouldDisable(60, 60)).toBe(false);
		expect(shouldDisable(61, 60)).toBe(false);
	});

	it("disables places below the minimum", () => {
		expect(shouldDisable(59, 60)).toBe(true);
		expect(shouldDisable(0, 1)).toBe(true);
	});

	it("never disables a place with an unknown chance", () => {
		expect(shouldDisable(null, 60)).toBe(false);
	});
});
