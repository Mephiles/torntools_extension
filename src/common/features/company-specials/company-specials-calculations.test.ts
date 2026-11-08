import { describe, expect, it } from "bun:test";
import { calculateMissingStat, calculateMugPercentages } from "./company-specials-calculations";

describe("calculateMugPercentages", () => {
	it("uses the base range without merits or a reduced target", () => {
		expect(calculateMugPercentages()).toEqual({ min: 5, max: 10 });
	});

	it("raises the range by 5% per Masterful Looting level", () => {
		expect(calculateMugPercentages({ masterfulLootingLevel: 4 })).toEqual({ min: 6, max: 12 });
	});

	it("quarters the range for a 7*+ Adult Novelties target", () => {
		expect(calculateMugPercentages({ targetReducesMug: true })).toEqual({ min: 1.25, max: 2.5 });
	});

	it("applies both adjustments together", () => {
		expect(calculateMugPercentages({ masterfulLootingLevel: 10, targetReducesMug: true })).toEqual({ min: 1.875, max: 3.75 });
	});
});

describe("calculateMissingStat", () => {
	const stats = { strength: 100, speed: 200, dexterity: 300, defense: 400, total: 1000 };

	it("derives a single missing stat from the total", () => {
		expect(calculateMissingStat({ ...stats, speed: -1 }, "speed")).toBe(200);
	});

	it("derives the total from the individual stats", () => {
		expect(calculateMissingStat({ ...stats, total: -1 }, "total")).toBe(1000);
	});

	it("works with the British spelling of defence", () => {
		expect(calculateMissingStat({ strength: 100, speed: 200, dexterity: 300, defence: 400, total: 1000 }, "defence")).toBe(400);
	});
});
