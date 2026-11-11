export function lotteryChance(owned: number, total: number): number | null {
	if (!Number.isSafeInteger(owned) || !Number.isSafeInteger(total) || owned < 0 || total <= 0 || owned > total) return null;
	return (owned / total) * 100;
}
