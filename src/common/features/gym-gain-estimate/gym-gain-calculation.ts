/** Approximation based on Vladar's published gym formula: https://www.torn.com/forums.php?p=threads&f=61&t=16003284 */
export function estimateGymGains(stat: number, happy: number, dots: number, energyPerTrain: number, trains: number, multiplier = 1): number | null {
	if (![stat, happy, dots, energyPerTrain, trains, multiplier].every(Number.isFinite)) return null;
	if (stat < 0 || happy < 0 || dots <= 0 || energyPerTrain <= 0 || multiplier <= 0 || !Number.isInteger(trains) || trains < 0 || trains > 1000) return null;
	let total = 0;
	for (let i = 0; i < trains; i++) {
		const gain = multiplier * dots * energyPerTrain * ((3.48e-7 * Math.log(happy + 250) + 3.09e-6) * (stat + total) + 6.83e-5 * (happy + 250) - 0.03);
		total += Math.max(0, gain);
		happy = Math.max(0, happy - Math.round(energyPerTrain / 2));
	}
	return total;
}

export function gymPerkMultiplier(perks: string[], stat: "strength" | "defense" | "speed" | "dexterity"): number {
	let multiplier = 1;
	for (const perk of perks) {
		const text = perk.toLowerCase();
		if (!text.includes("gym gains")) continue;
		const names = ["strength", "defense", "speed", "dexterity"];
		if (names.some((name) => text.includes(name)) && !text.includes(stat)) continue;
		const match = text.match(/\+\s*(\d+(?:\.\d+)?)\s*%/);
		if (match) multiplier *= 1 + Number(match[1]) / 100;
	}
	return multiplier;
}
