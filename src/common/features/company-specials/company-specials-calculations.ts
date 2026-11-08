export interface MugPercentageOptions {
	masterfulLootingLevel?: number;
	targetReducesMug?: boolean;
}

export interface MugPercentages {
	min: number;
	max: number;
}

/**
 * The muggable range is 5-10% of the cash on hand.
 * Each Masterful Looting merit level raises it by 5%, while a 7*+ Adult Novelties target lowers it to a quarter.
 */
export function calculateMugPercentages({ masterfulLootingLevel = 0, targetReducesMug = false }: MugPercentageOptions = {}): MugPercentages {
	const meritMultiplier = 1 + masterfulLootingLevel * 0.05;

	let min = 5 * meritMultiplier;
	let max = 10 * meritMultiplier;

	if (targetReducesMug) {
		min /= 4;
		max /= 4;
	}

	return { min, max };
}

export function calculateMissingStat(stats: Record<string, number>, missingStat: string): number {
	return Object.entries(stats)
		.filter(([stat]) => stat !== missingStat)
		.map(([stat, value]) => (stat === "total" || missingStat === "total" ? value : -value))
		.reduce((total, value) => total + value, 0);
}
