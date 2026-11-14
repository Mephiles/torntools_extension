import type { InternalLotteryData } from "@common/pages/lottery-page.ts";

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
