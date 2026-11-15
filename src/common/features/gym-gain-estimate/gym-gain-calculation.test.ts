import { describe, expect, it } from "bun:test";
import { estimateGymGains, gymPerkMultiplier } from "./gym-gain-calculation";

describe("estimateGymGains", () => {
	it("calculates a low-stat train using gym dots", () => {
		const estimate = estimateGymGains(5064.28, 951, 5, 10, 1, 1, "strength");
		expect(estimate.one).toBeCloseTo(4.91008, 4);
	});
	it("matches the maintainer's high-stat spreadsheet example", () => {
		const multiplier = 1.1 * 1.02 * 1.01 * 1.01;
		const estimate = estimateGymGains(2_640_006_600, 5025, 7.5, 25, 1, multiplier, "strength");
		expect(estimate.one).toBeCloseTo(105960.71, 1);
		expect(estimate.total).toBe(estimate.one);
	});
	it("models stat-specific gains and multiple trains", () => {
		const strength = estimateGymGains(5000, 1000, 4, 10, 9, 1, "strength");
		const defense = estimateGymGains(5000, 1000, 4, 10, 9, 1, "defense");
		expect(strength.one).toBeGreaterThan(defense.one);
		expect(strength.total).toBeGreaterThan(strength.one);
	});
});

describe("gymPerkMultiplier", () => {
	it("combines applicable positive perks without applying other stats", () => {
		expect(gymPerkMultiplier(["+3% gym gains", "+10% strength gym gains", "+10% defense gym gains"], "strength")).toBeCloseTo(1.133);
	});
});
