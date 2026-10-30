/** Reads the percentage Torn prints in a place's chance label, e.g. "Status: On-Peak (55%)". */
export function parseChance(label: string | null | undefined): number | null {
	const match = (label ?? "").match(/\((\d{1,3})%\)\s*$/);
	if (!match) return null;

	const chance = Number(match[1]);
	return chance <= 100 ? chance : null;
}

/** Only ever disable a place whose chance we could read, so an unknown markup can never lock us out. */
export function shouldDisable(chance: number | null, minChance: number): boolean {
	return chance !== null && minChance > 0 && chance < minChance;
}
