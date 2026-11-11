export function lotteryChance(owned: number, total: number): number | null {
	if (!Number.isSafeInteger(owned) || !Number.isSafeInteger(total) || owned < 0 || total <= 0 || owned > total) return null;
	return (owned / total) * 100;
}

export function lotteryTickets(data: any): { id: string; owned: number; total: number }[] {
	const running = data?.DB?.runningLotteries;
	const users = data?.DB?.currentUserStats;
	if (!Array.isArray(running) || !users || typeof users !== "object") return [];
	const userEntries = Object.values(users).flat();
	return running.flatMap((lottery) => {
		const user = userEntries.find((entry: any) => entry?.templateClass === lottery.templateClass) as any;
		if (!user || typeof user.totalTickets !== "number" || typeof lottery.totalTickets !== "number") return [];
		return [{ id: lottery.templateClass, owned: user.totalTickets, total: lottery.totalTickets }];
	});
}
