requireDatabase().then(() => {
	requireNavbar().then(() => {
		console.log("TT - Missions | Achievements");

		let show_completed = settings.achievements.completed;
		let personalstats = userdata.personalstats;

		if (!settings.achievements.show) return;

		// object of all the achievements on this page
		const achievements = {
			"Attacks won": {
				stats: personalstats.attackswon,
				keyword: "attacks",
				incl: ["win"],
			},
			"Defends won": {
				stats: personalstats.defendswon,
				keyword: "defend",
				excl: ["achieve", "someone", "and"],
			},
			Assists: {
				stats: personalstats.attacksassisted,
				keyword: "assist",
				incl: ["attacks"],
				goals: [1],
			},
			Stealthed: {
				stats: personalstats.attacksstealthed,
				keyword: "stealthed attacks",
			},
			Stalemates: {
				stats: personalstats.defendsstalemated,
				keyword: "stalemate",
			},
			Escapes: {
				stats: personalstats.yourunaway,
				keyword: "escape",
				incl: ["successfully", "foes"],
			},
			"Unarmored wins": {
				stats: personalstats.unarmoredwon,
				keyword: "unarmored",
			},
			"Current killstreak": {
				stats: personalstats.killstreak,
				keyword: "",
				extra: "###",
			},
			"Best streak": {
				stats: personalstats.bestkillstreak,
				keyword: "streak",
				excl: ["high-low"],
			},
			"Total hits": {
				stats: personalstats.attackhits,
				keyword: "hits",
				excl: ["critical", "finishing"],
			},
			"Critical hits": {
				stats: personalstats.attackcriticalhits,
				keyword: "critical",
			},
			"Best damage": {
				stats: personalstats.bestdamage,
				keyword: "damage",
				incl: ["deal at least"],
			},
			"One hit kills": {
				stats: personalstats.onehitkills,
				keyword: "one hit",
				incl: ["kills"],
			},
			"Rounds fired": {
				stats: personalstats.roundsfired,
				keyword: "rounds",
				incl: ["fire"],
			},
			"Clubbing hits": {
				stats: personalstats.axehits,
				keyword: "clubbing",
			},
			"Pistol hits": {
				stats: personalstats.pishits,
				keyword: "pistols",
			},
			"Rifle hits": {
				stats: personalstats.rifhits,
				keyword: "rifles",
			},
			"Shotgun hits": {
				stats: personalstats.shohits,
				keyword: "shotguns",
			},
			"Piercing hits": {
				stats: personalstats.piehits,
				keyword: "piercing",
			},
			"Slashing hits": {
				stats: personalstats.slahits,
				keyword: "slashing",
			},
			"Heavy hits": {
				stats: personalstats.heahits,
				keyword: "heavy artillery",
			},
			"SMG hits": {
				stats: personalstats.smghits,
				keyword: "smgs",
			},
			"Machine gun hits": {
				stats: personalstats.machits,
				keyword: "machine guns",
				incl: ["guns"],
			},
			"Fists or kick hits": {
				stats: personalstats.h2hhits,
				keyword: "fists or kick",
			},
			"Mechanical hits": {
				stats: personalstats.chahits,
				keyword: "mechanical weapons",
			},
			"Temporary hits": {
				stats: personalstats.grehits,
				keyword: "temporary weapons",
			},
			"Largest mug": {
				stats: personalstats.largestmug,
				keyword: "mugging",
				incl: ["make", "single"],
			},
			"Mission credits": {
				stats: personalstats.missioncreditsearned,
				keyword: "credits",
				incl: ["mission"],
			},
			Contracts: {
				stats: personalstats.contractscompleted,
				keyword: "contracts",
			},
		};

		displayAchievements(achievements, show_completed);
	});
});
