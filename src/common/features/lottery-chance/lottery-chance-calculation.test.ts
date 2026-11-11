import { describe, expect, it } from "bun:test";
import { lotteryChance } from "./lottery-chance-calculation";

describe("lotteryChance", () => {
	it("calculates the percentage of tickets owned", () => {
		expect(lotteryChance(25, 1000)).toBe(2.5);
		expect(lotteryChance(0, 100)).toBe(0);
	});

	it("rejects invalid or unavailable ticket totals", () => {
		for (const [owned, total] of [
			[0, 0],
			[2, 1],
			[-1, 10],
			[1.5, 10],
			[NaN, 10],
		]) {
			expect(lotteryChance(owned, total)).toBeNull();
		}
	});
});
