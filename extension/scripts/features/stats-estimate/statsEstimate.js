const RANKS = {
	"Absolute beginner": 1,
	Beginner: 2,
	Inexperienced: 3,
	Rookie: 4,
	Novice: 5,
	"Below average": 6,
	Average: 7,
	Reasonable: 8,
	"Above average": 9,
	Competent: 10,
	"Highly competent": 11,
	Veteran: 12,
	Distinguished: 13,
	"Highly distinguished": 14,
	Professional: 15,
	Star: 16,
	Master: 17,
	Outstanding: 18,
	Celebrity: 19,
	Supreme: 20,
	Idolized: 21,
	Champion: 22,
	Heroic: 23,
	Legendary: 24,
	Elite: 25,
	Invincible: 26,
};

const RANK_TRIGGERS = {
	level: [2, 6, 11, 26, 31, 50, 71, 100],
	crimes: [100, 5000, 10000, 20000, 30000, 50000],
	networth: [5000000, 50000000, 500000000, 5000000000, 50000000000],

	stats: ["under 2k", "2k - 25k", "20k - 250k", "200k - 2.5m", "2m - 25m", "20m - 250m", "over 200m"],
};

function calculateEstimateBattleStats(rank, level, crimes, networth) {
	rank = rank.match(/[A-Z][a-z ]+/g)[0].trim();

	const triggersLevel = RANK_TRIGGERS.level.filter((x) => x <= level).length;
	const triggersCrimes = RANK_TRIGGERS.crimes.filter((x) => x <= crimes).length;
	const triggersNetworth = RANK_TRIGGERS.networth.filter((x) => x <= networth).length;

	const triggersStats = RANKS[rank] - triggersLevel - triggersCrimes - triggersNetworth - 1;

	return RANK_TRIGGERS.stats[triggersStats] ?? "N/A";
}

function cacheStatsEstimate(id, estimate, lastAction) {
	let days = 7;

	if (estimate === RANK_TRIGGERS.stats.last()) days = 31;
	else if (lastAction && lastAction <= Date.now() - TO_MILLIS.DAYS * 180) days = 31;
	else if (estimate === "N/A") days = 1;

	return ttCache.set({ [id]: estimate }, TO_MILLIS.DAYS * days, "stats-estimate");
}
