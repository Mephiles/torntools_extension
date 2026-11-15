type GymStat = "strength" | "defense" | "speed" | "dexterity";
const CONSTANTS: Record<GymStat, [number, number, number]> = {
	strength: [1600, 1700, 700],
	defense: [2100, -600, 1500],
	speed: [1600, 2000, 1350],
	dexterity: [1800, 1500, 1000],
};

function round4(value: number) {
	return Math.round(value * 10_000) / 10_000;
}

/** Vladar's spreadsheet, including the post-50m adjustment and happy-loss range. */
export function estimateGymGains(stat: number, happy: number, dots: number, energy: number, trains: number, multiplier: number, type: GymStat) {
	const [a, b, error] = CONSTANTS[type];
	const gain = (value: number, happiness: number, adjustment = 0) => {
		const effectiveStat = value < 50_000_000 ? value : 50_000_000 + (value - 50_000_000) / (8.77635 * Math.log10(value));
		const happyMultiplier = round4(1 + 0.07 * round4(Math.log(1 + happiness / 250)));
		return (
			((effectiveStat * happyMultiplier + 8 * happiness ** 1.05 + a * (1 - (happiness / 99999) ** 2) + b + adjustment) * dots * energy * multiplier) /
			200_000
		);
	};
	const one = gain(stat, happy);
	let low = 0;
	let high = 0;
	for (let i = 0; i < trains; i++) {
		low += gain(stat + low, Math.max(0, happy - i * energy * 0.6), -error);
		high += gain(stat + high, Math.max(0, happy - i * energy * 0.4), error);
	}
	return { one, total: trains === 1 ? one : (low + high) / 2 };
}

export function gymPerkMultiplier(perks: string[], stat: GymStat): number {
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
