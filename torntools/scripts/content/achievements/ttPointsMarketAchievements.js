requireDatabase().then(() => {
	requireNavbar().then(() => {
		console.log("TT - Points Market | Achievements");

		let show_completed = settings.achievements.completed;
		let personalstats = userdata.personalstats;

		if (!settings.achievements.show)
			return;

		// object of all the achievements on this page
		const achievements = {
			"Points sold": {
				stats: personalstats.pointssold,
				keyword: "points",
				incl: ["market"],
			},
		};

		displayAchievements(achievements, show_completed);
	});
});