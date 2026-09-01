import { describe, expect, it } from "bun:test";
import type { UserStock } from "tornapi-typescript";
import { getNextChainBonus, getRequiredStocks, getStockBoughtPrice, getStockIncrement, getStockReward, isDividendStock } from "./torn";

describe("torn", () => {
	describe("getNextChainBonus", () => {
		it("should return the first bonus above the current", () => {
			expect(getNextChainBonus(0)).toBe(10);
			expect(getNextChainBonus(9)).toBe(10);
			expect(getNextChainBonus(10)).toBe(25);
			expect(getNextChainBonus(100)).toBe(250);
			expect(getNextChainBonus(5000)).toBe(10000);
		});

		it("should return undefined at or above the maximum bonus", () => {
			expect(getNextChainBonus(100000)).toBeUndefined();
			expect(getNextChainBonus(999999)).toBeUndefined();
		});
	});

	describe("isDividendStock", () => {
		it("should return true for dividend paying stocks", () => {
			expect(isDividendStock(1)).toBe(true);
			expect(isDividendStock(7)).toBe(true);
			expect(isDividendStock(35)).toBe(true);
		});

		it("should return true for numeric strings", () => {
			expect(isDividendStock("4")).toBe(true);
			expect(isDividendStock("28")).toBe(true);
		});

		it("should return false for non-dividend stocks", () => {
			expect(isDividendStock(2)).toBe(false);
			expect(isDividendStock(36)).toBe(false);
		});

		it("should return false for non-numeric strings", () => {
			expect(isDividendStock("abc")).toBe(false);
			expect(isDividendStock("")).toBe(false);
		});
	});

	describe("getRequiredStocks", () => {
		it("should require no stocks at increment 0", () => {
			expect(getRequiredStocks(100, 0)).toBe(0);
		});

		it("should double the required stocks with each increment", () => {
			expect(getRequiredStocks(100, 1)).toBe(100);
			expect(getRequiredStocks(100, 2)).toBe(300);
			expect(getRequiredStocks(100, 3)).toBe(700);
		});
	});

	describe("getStockIncrement", () => {
		it("should return the increment for the current stock count", () => {
			expect(getStockIncrement(100, 100)).toBe(1);
			expect(getStockIncrement(100, 300)).toBe(2);
			expect(getStockIncrement(100, 700)).toBe(3);
		});

		it("should return 0 below the first increment threshold", () => {
			expect(getStockIncrement(100, 0)).toBe(0);
			expect(getStockIncrement(100, 99)).toBe(0);
		});
	});

	describe("getStockReward", () => {
		it("should multiply cash rewards", () => {
			expect(getStockReward("$1,000", 2)).toBe("$2,000");
			expect(getStockReward("$500", 3)).toBe("$1,500");
		});

		it("should multiply item rewards and keep the x suffix", () => {
			expect(getStockReward("5x Energy Drink", 2)).toBe("10x Energy Drink");
		});

		it("should multiply item rewards without an x suffix", () => {
			expect(getStockReward("3 First Aid Kit", 2)).toBe("6 First Aid Kit");
		});

		it("should flag unknown rewards", () => {
			expect(getStockReward("garbage", 1)).toBe("Unknown, please report this!");
		});
	});

	describe("getStockBoughtPrice", () => {
		it("should calculate the total spent and average price per share", () => {
			const stock: UserStock = {
				id: 1,
				shares: 10,
				transactions: [
					{ id: 1, shares: 2, price: 100, timestamp: 1 },
					{ id: 2, shares: 8, price: 200, timestamp: 2 },
				],
				bonus: { available: false, increment: 0, progress: 0, frequency: 0 },
			};

			expect(getStockBoughtPrice(stock)).toEqual({ boughtTotal: 1800, boughtPrice: 180 });
		});

		it("should return the transaction price for a single transaction", () => {
			const stock: UserStock = {
				id: 2,
				shares: 5,
				transactions: [{ id: 1, shares: 5, price: 150, timestamp: 1 }],
				bonus: { available: false, increment: 0, progress: 0, frequency: 0 },
			};

			expect(getStockBoughtPrice(stock)).toEqual({ boughtTotal: 750, boughtPrice: 150 });
		});
	});
});
