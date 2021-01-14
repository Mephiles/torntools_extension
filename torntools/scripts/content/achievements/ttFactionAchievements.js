requireDatabase().then(() => {
	requireNavbar().then(() => {
		console.log("TT - Faction | Achievements");

		let show_completed = settings.achievements.completed;
		let personalstats = userdata.personalstats;

		if (!settings.achievements.show) return;

		// object of all the achievements on this page
		const achievements = {
			"Org. crimes": {
				stats: personalstats.organisedcrimes,
				keyword: "organized crimes",
			},
			Respect: {
				stats: personalstats.respectforfaction,
				keyword: "respect",
				incl: ["earn "],
			},
		};

		displayAchievements(achievements, show_completed);
	});
});
