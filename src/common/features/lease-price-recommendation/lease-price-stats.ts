import { arraysEquals } from "@common/utils/functions/utilities.ts";

export interface RentalListingLike {
	happy: number;
	cost: number;
	modifications: string[];
	rental_period: number;
	cost_per_day?: number;
}

export interface LeasePriceStats {
	min: number;
	max: number;
	recommended: number;
	matchCount: number;
	filter: ComparingFilter;
}

export interface DailyRateStats {
	minPerDay: number;
	maxPerDay: number;
	recommendedPerDay: number;
	matchCount: number;
	filter: ComparingFilter;
}

export interface LeasePriceStatsOptions {
	happyTolerance?: number;
	cheapestCount?: number;
	minHappyMatches?: number;
}

const DEFAULT_OPTIONS: Required<LeasePriceStatsOptions> = {
	happyTolerance: 0.15,
	cheapestCount: 10,
	minHappyMatches: 3,
};

export function costPerDay(listing: RentalListingLike): number {
	if (listing.cost_per_day != null && Number.isFinite(listing.cost_per_day)) {
		return listing.cost_per_day;
	}
	if (listing.rental_period <= 0) return listing.cost;
	return Math.round(listing.cost / listing.rental_period);
}

export function filterByRentalPeriod(listings: RentalListingLike[], days: number): RentalListingLike[] {
	return listings.filter((listing) => listing.rental_period === days);
}

export function filterByHappyBand(listings: RentalListingLike[], happy: number, tolerance: number): RentalListingLike[] {
	const minHappy = happy * (1 - tolerance);
	const maxHappy = happy * (1 + tolerance);
	return listings.filter((listing) => listing.happy >= minHappy && listing.happy <= maxHappy);
}

export function filterByModifications(listings: RentalListingLike[], modifications: string[]): RentalListingLike[] {
	const sortedModifications = Array.from(modifications).sort();

	return listings.filter((listing) => arraysEquals(Array.from(listing.modifications).sort(), sortedModifications));
}

export function median(values: number[]): number {
	if (values.length === 0) throw new Error("Cannot compute median of an empty list.");

	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);

	if (sorted.length % 2 === 0) {
		return Math.round((sorted[middle - 1]! + sorted[middle]!) / 2);
	}

	return sorted[middle]!;
}

export function recommendedFromCosts(costs: number[], cheapestCount: number): number {
	const cheapest = [...costs].sort((a, b) => a - b).slice(0, cheapestCount);
	return median(cheapest);
}

type ComparingFilter = "none" | "modifications" | "happy";

function selectComparableListings(
	listings: RentalListingLike[],
	happy: number,
	modifications: string[],
	options: Required<LeasePriceStatsOptions>,
): { comparable: RentalListingLike[]; filter: ComparingFilter } {
	if (listings.length === 0) return { comparable: [], filter: "none" };

	const modificationMatches = filterByModifications(listings, modifications);
	if (modificationMatches.length > 0) {
		return { comparable: modificationMatches, filter: "modifications" };
	}

	const happyMatches = filterByHappyBand(listings, happy, options.happyTolerance);
	if (happyMatches.length >= options.minHappyMatches) {
		return { comparable: happyMatches, filter: "happy" };
	}

	return { comparable: listings, filter: "none" };
}

/**
 * Compute min/max/recommended lease cost for listings matching the rental period.
 */
export function computeLeasePriceStats(
	listings: RentalListingLike[],
	days: number,
	happy: number,
	modifications: string[],
	partialOptions: LeasePriceStatsOptions = {},
): LeasePriceStats | null {
	const options = { ...DEFAULT_OPTIONS, ...partialOptions };
	const samePeriod = filterByRentalPeriod(listings, days);
	if (samePeriod.length === 0) return null;

	const { comparable, filter } = selectComparableListings(samePeriod, happy, modifications, options);
	const costs = comparable.map((listing) => listing.cost);

	return {
		min: Math.min(...costs),
		max: Math.max(...costs),
		recommended: recommendedFromCosts(costs, options.cheapestCount),
		matchCount: comparable.length,
		filter,
	};
}

/**
 * Compute min/max/recommended cost-per-day across all market listings (any period).
 */
export function computeDailyRateStats(
	listings: RentalListingLike[],
	happy: number,
	modifications: string[],
	partialOptions: LeasePriceStatsOptions = {},
): DailyRateStats | null {
	const options = { ...DEFAULT_OPTIONS, ...partialOptions };
	if (listings.length === 0) return null;

	const { comparable, filter } = selectComparableListings(listings, happy, modifications, options);
	const rates = comparable.map(costPerDay);

	return {
		minPerDay: Math.min(...rates),
		maxPerDay: Math.max(...rates),
		recommendedPerDay: recommendedFromCosts(rates, options.cheapestCount),
		matchCount: comparable.length,
		filter,
	};
}
