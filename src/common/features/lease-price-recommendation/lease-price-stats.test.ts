import { describe, expect, it } from "bun:test";
import type { RentalListingLike } from "./lease-price-stats";
import {
	computeDailyRateStats,
	computeLeasePriceStats,
	costPerDay,
	filterByHappyBand,
	filterByRentalPeriod,
	median,
	recommendedFromCosts,
	totalFromDailyRate,
} from "./lease-price-stats";

function listing(partial: Partial<RentalListingLike> & Pick<RentalListingLike, "cost" | "rental_period">): RentalListingLike {
	return {
		happy: 100,
		...partial,
	};
}

describe("filterByRentalPeriod", () => {
	it("keeps only listings with the exact period", () => {
		const listings = [listing({ cost: 1, rental_period: 7 }), listing({ cost: 2, rental_period: 14 }), listing({ cost: 3, rental_period: 7 })];
		expect(filterByRentalPeriod(listings, 7).map((l) => l.cost)).toEqual([1, 3]);
	});
});

describe("filterByHappyBand", () => {
	it("keeps listings within the tolerance band", () => {
		const listings = [
			listing({ cost: 1, rental_period: 7, happy: 100 }),
			listing({ cost: 2, rental_period: 7, happy: 110 }),
			listing({ cost: 3, rental_period: 7, happy: 200 }),
		];
		expect(filterByHappyBand(listings, 100, 0.15).map((l) => l.cost)).toEqual([1, 2]);
	});
});

describe("median", () => {
	it("returns the middle value for an odd-length list", () => {
		expect(median([3, 1, 2])).toBe(2);
	});

	it("returns the rounded average of the two middle values for an even-length list", () => {
		expect(median([1, 2, 3, 4])).toBe(3);
	});
});

describe("recommendedFromCosts", () => {
	it("uses the median of the cheapest N listings", () => {
		const costs = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 5];
		expect(recommendedFromCosts(costs, 10)).toBe(median([5, 10, 20, 30, 40, 50, 60, 70, 80, 90]));
	});

	it("uses all listings when fewer than N exist", () => {
		expect(recommendedFromCosts([30, 10, 20], 10)).toBe(20);
	});
});

describe("costPerDay", () => {
	it("uses the listing cost_per_day when present", () => {
		expect(costPerDay(listing({ cost: 100, rental_period: 10, cost_per_day: 12 }))).toBe(12);
	});

	it("derives cost per day from cost and period", () => {
		expect(costPerDay(listing({ cost: 700, rental_period: 7 }))).toBe(100);
	});
});

describe("computeLeasePriceStats", () => {
	it("returns null when no listings match the period", () => {
		expect(computeLeasePriceStats([listing({ cost: 10, rental_period: 14 })], 7)).toBeNull();
	});

	it("computes min, max and recommended from same-period listings", () => {
		const listings = [
			listing({ cost: 100, rental_period: 7 }),
			listing({ cost: 50, rental_period: 7 }),
			listing({ cost: 200, rental_period: 7 }),
			listing({ cost: 999, rental_period: 14 }),
		];

		const stats = computeLeasePriceStats(listings, 7);
		expect(stats).toEqual({
			min: 50,
			max: 200,
			recommended: 100,
			matchCount: 3,
			usedHappyFilter: false,
		});
	});

	it("prefers a happiness band when enough matches remain", () => {
		const listings = [
			listing({ cost: 10, rental_period: 7, happy: 100 }),
			listing({ cost: 20, rental_period: 7, happy: 105 }),
			listing({ cost: 30, rental_period: 7, happy: 110 }),
			listing({ cost: 1000, rental_period: 7, happy: 500 }),
		];

		const stats = computeLeasePriceStats(listings, 7, 100);
		expect(stats).toEqual({
			min: 10,
			max: 30,
			recommended: 20,
			matchCount: 3,
			usedHappyFilter: true,
		});
	});

	it("falls back to all same-period listings when the happy band is too thin", () => {
		const listings = [
			listing({ cost: 10, rental_period: 7, happy: 100 }),
			listing({ cost: 20, rental_period: 7, happy: 105 }),
			listing({ cost: 1000, rental_period: 7, happy: 500 }),
		];

		const stats = computeLeasePriceStats(listings, 7, 100);
		expect(stats?.usedHappyFilter).toBe(false);
		expect(stats?.matchCount).toBe(3);
		expect(stats?.max).toBe(1000);
	});
});

describe("computeDailyRateStats", () => {
	it("returns null for an empty market", () => {
		expect(computeDailyRateStats([])).toBeNull();
	});

	it("computes min, max and recommended daily rates across all periods", () => {
		const listings = [
			listing({ cost: 700, rental_period: 7, cost_per_day: 100 }),
			listing({ cost: 1400, rental_period: 14, cost_per_day: 80 }),
			listing({ cost: 300, rental_period: 3, cost_per_day: 120 }),
		];

		const stats = computeDailyRateStats(listings);
		expect(stats).toEqual({
			minPerDay: 80,
			maxPerDay: 120,
			recommendedPerDay: 100,
			matchCount: 3,
			usedHappyFilter: false,
		});
	});
});

describe("totalFromDailyRate", () => {
	it("multiplies the daily rate by the selected days", () => {
		expect(totalFromDailyRate(100, 7)).toBe(700);
	});
});
