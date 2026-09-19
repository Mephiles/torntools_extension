export interface RentalListingLike {
	happy: number;
	cost: number;
	rental_period: number;
	cost_per_day?: number;
}

export interface LeasePriceStats {
	min: number;
	max: number;
	recommended: number;
	matchCount: number;
	usedHappyFilter: boolean;
}

export interface DailyRateStats {
	minPerDay: number;
	maxPerDay: number;
	recommendedPerDay: number;
	matchCount: number;
	usedHappyFilter: boolean;
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

export function filterByRentalPeriod<T extends RentalListingLike>(listings: T[], days: number): T[] {
	return listings.filter((listing) => listing.rental_period === days);
}

export function filterByHappyBand<T extends RentalListingLike>(listings: T[], happy: number, tolerance: number): T[] {
	const minHappy = happy * (1 - tolerance);
	const maxHappy = happy * (1 + tolerance);
	return listings.filter((listing) => listing.happy >= minHappy && listing.happy <= maxHappy);
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

function selectComparableListings<T extends RentalListingLike>(
	listings: T[],
	happy: number | null | undefined,
	options: Required<LeasePriceStatsOptions>,
): { comparable: T[]; usedHappyFilter: boolean } {
	if (listings.length === 0) return { comparable: [], usedHappyFilter: false };

	if (happy != null && Number.isFinite(happy)) {
		const happyMatches = filterByHappyBand(listings, happy, options.happyTolerance);
		if (happyMatches.length >= options.minHappyMatches) {
			return { comparable: happyMatches, usedHappyFilter: true };
		}
	}

	return { comparable: listings, usedHappyFilter: false };
}

/**
 * Compute min/max/recommended lease cost for listings matching the rental period.
 * When happiness is known and enough listings fall in ±tolerance, prefer that subset.
 */
export function computeLeasePriceStats(
	listings: RentalListingLike[],
	days: number,
	happy?: number | null,
	partialOptions: LeasePriceStatsOptions = {},
): LeasePriceStats | null {
	const options = { ...DEFAULT_OPTIONS, ...partialOptions };
	const samePeriod = filterByRentalPeriod(listings, days);
	if (samePeriod.length === 0) return null;

	const { comparable, usedHappyFilter } = selectComparableListings(samePeriod, happy, options);
	const costs = comparable.map((listing) => listing.cost);

	return {
		min: Math.min(...costs),
		max: Math.max(...costs),
		recommended: recommendedFromCosts(costs, options.cheapestCount),
		matchCount: comparable.length,
		usedHappyFilter,
	};
}

/**
 * Compute min/max/recommended cost-per-day across all market listings (any period).
 */
export function computeDailyRateStats(
	listings: RentalListingLike[],
	happy?: number | null,
	partialOptions: LeasePriceStatsOptions = {},
): DailyRateStats | null {
	const options = { ...DEFAULT_OPTIONS, ...partialOptions };
	if (listings.length === 0) return null;

	const { comparable, usedHappyFilter } = selectComparableListings(listings, happy, options);
	const rates = comparable.map(costPerDay);

	return {
		minPerDay: Math.min(...rates),
		maxPerDay: Math.max(...rates),
		recommendedPerDay: recommendedFromCosts(rates, options.cheapestCount),
		matchCount: comparable.length,
		usedHappyFilter,
	};
}

export function totalFromDailyRate(perDay: number, days: number): number {
	return perDay * days;
}
