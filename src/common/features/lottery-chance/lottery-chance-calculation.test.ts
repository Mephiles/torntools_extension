import { describe, expect, it } from "bun:test";
import type { InternalLotteryData } from "@common/pages/lottery-page";
import { lotteryChance, lotteryTickets } from "./lottery-chance-calculation";

function lottery(templateClass: string, totalTickets: number): InternalLotteryData["DB"]["runningLotteries"][number] {
	return {
		ID: 0,
		lotteryID: 0,
		totalTickets,
		totalMoney: 0,
		timeStarted: 0,
		timeEnded: 0,
		title: templateClass,
		ticketPrice: 0,
		templateClass,
		timeLeft: 0,
	};
}

function stats(templateClass: string, totalTickets: number): InternalLotteryData["DB"]["currentUserStats"][string] {
	return [{ lotteryID: 0, templateClass, totalTickets }];
}

function lotteryData(overrides: Partial<InternalLotteryData["DB"]> = {}): InternalLotteryData {
	return {
		DB: {
			runningLotteries: [],
			user: { userID: 1, otherstatus: 0, money: 0, slotturns: 0 },
			currentUserStats: {},
			lotteries: [],
			...overrides,
		},
	};
}

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
		const data = lotteryData({
			runningLotteries: [lottery("daily-dime", 1000), lottery("lucky-shot", 500)],
			currentUserStats: { 2: stats("lucky-shot", 5), 1: stats("daily-dime", 25) },
		});

		expect(lotteryTickets(data)).toEqual([
			{ id: "daily-dime", owned: 25, total: 1000 },
			{ id: "lucky-shot", owned: 5, total: 500 },
		]);
	});

	it("ignores lotteries without user stats", () => {
		expect(lotteryTickets(lotteryData())).toEqual([]);
		expect(lotteryTickets(lotteryData({ runningLotteries: [lottery("daily-dime", 100)] }))).toEqual([]);
	});
});
