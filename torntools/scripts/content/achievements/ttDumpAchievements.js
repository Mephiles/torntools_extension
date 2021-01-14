requireDatabase().then(() => {
	requireNavbar().then(() => {
		console.log("TT - Dump | Achievements");

		let show_completed = settings.achievements.completed;
		let personalstats = userdata.personalstats;

		if (!settings.achievements.show) return;

		// object of all the achievements on this page
		const achievements = {
			"Dump finds": {
				stats: personalstats.dumpfinds,
				keyword: "dump",
				incl: ["find"],
			},
		};

		displayAchievements(achievements, show_completed);
	});
});
