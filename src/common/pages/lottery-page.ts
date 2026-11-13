interface Lottery {
	ID: number;
	lotteryID: number;
	totalTickets: number;
	totalMoney: number;
	timeStarted: number;
	timeEnded: number;
	title: string;
	ticketPrice: number;
	templateClass: string;
	timeLeft: number;
}

export interface InternalLotteryData {
	DB: {
		runningLotteries: Lottery[];
		user: { userID: number; otherstatus: number; money: number; slotturns: number };
		currentUserStats: Record<string, [{ lotteryID: number; totalTickets: number; templateClass: string }]>;
		lotteries: Lottery[];
	};
}

export function isLotteryData(sid: string | null, _json: unknown): _json is InternalLotteryData {
	return sid === "lotteryData";
}
