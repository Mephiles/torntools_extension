requireDatabase().then(() => {
	requireNavbar().then(() => {
		console.log("TT - Bounties | Achievements");

		let show_completed = settings.achievements.completed;
		let personalstats = userdata.personalstats;

		if (!settings.achievements.show) return;

		// object of all the achievements on this page
		const achievements = {
			"Bounties collected": {
				stats: personalstats.bountiescollected,
				keyword: "bounties",
				incl: ["collect"],
			},
			"Bounties collected (money)": {
				stats: personalstats.totalbountyreward,
				keyword: "bounty",
				incl: ["earn", "hunting"],
			},
		};

		displayAchievements(achievements, show_completed);
	});
});
