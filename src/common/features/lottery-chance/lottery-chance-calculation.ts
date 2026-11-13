import type { InternalLotteryData } from "@common/pages/lottery-page.ts";

export function lotteryChance(owned: number, total: number): number | null {
	if (!Number.isSafeInteger(owned) || !Number.isSafeInteger(total) || owned < 0 || total <= 0 || owned > total) return null;
	return (owned / total) * 100;
}

export function lotteryTickets(data: InternalLotteryData): { id: string; owned: number; total: number }[] {
	const running = data.DB.runningLotteries;
	const users = data.DB.currentUserStats;

	const userEntries = Object.values(users).flat();
	return running.flatMap((lottery) => {
		const user = userEntries.find((entry) => entry.templateClass === lottery.templateClass);
		if (!user) return [];

		return [{ id: lottery.templateClass, owned: user.totalTickets, total: lottery.totalTickets }];
	});
}
