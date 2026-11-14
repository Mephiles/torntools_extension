import { describe, expect, it } from "bun:test";
import { estimateGymGains, gymPerkMultiplier } from "./gym-gain-calculation";

describe("estimateGymGains", () => {
	it("estimates a single train and scales with gym dots and bonuses", () => {
		const gain = estimateGymGains(1_000_000, 5000, 4, 10, 1)!;
		expect(gain).toBeCloseTo(255.98, 0);
		expect(estimateGymGains(1_000_000, 5000, 8, 10, 1)).toBeCloseTo(gain * 2, 6);
		expect(estimateGymGains(1_000_000, 5000, 4, 10, 1, 1.1)).toBeCloseTo(gain * 1.1, 6);
	});
	it("models multiple trains and rejects invalid inputs", () => {
		expect(estimateGymGains(1_000_000, 5000, 4, 10, 0)).toBe(0);
		expect(estimateGymGains(1_000_000, 5000, 4, 10, 2)).toBeGreaterThan(estimateGymGains(1_000_000, 5000, 4, 10, 1)!);
		expect(estimateGymGains(1, 1, 0, 10, 1)).toBeNull();
		expect(estimateGymGains(1, 1, 4, 10, 1.5)).toBeNull();
	});
});

describe("gymPerkMultiplier", () => {
	it("combines applicable positive perks without applying other stats", () => {
		expect(gymPerkMultiplier(["+3% gym gains", "+10% strength gym gains", "+10% defense gym gains"], "strength")).toBeCloseTo(1.133);
		expect(gymPerkMultiplier(["-10% gym gains", "unrelated"], "strength")).toBe(1);
	});
});
