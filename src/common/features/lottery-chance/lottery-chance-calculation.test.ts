import { describe, expect, it } from "bun:test";
import { lotteryChance, lotteryTickets } from "./lottery-chance-calculation";

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

describe("lotteryTickets", () => {
	it("matches ticket totals using the lottery identity", () => {
		const data = {
			DB: {
				runningLotteries: [
					{ templateClass: "daily-dime", totalTickets: 1000 },
					{ templateClass: "lucky-shot", totalTickets: 500 },
				],
				currentUserStats: { 2: [{ templateClass: "lucky-shot", totalTickets: 5 }], 1: [{ templateClass: "daily-dime", totalTickets: 25 }] },
			},
		};
		expect(lotteryTickets(data)).toEqual([
			{ id: "daily-dime", owned: 25, total: 1000 },
			{ id: "lucky-shot", owned: 5, total: 500 },
		]);
	});

	it("ignores incomplete responses", () => {
		expect(lotteryTickets({})).toEqual([]);
		expect(lotteryTickets({ DB: { runningLotteries: [{ templateClass: "daily-dime", totalTickets: 100 }], currentUserStats: {} } })).toEqual([]);
	});
});
