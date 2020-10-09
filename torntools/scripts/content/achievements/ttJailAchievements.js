requireDatabase().then(() => {
	requireNavbar().then(() => {
		console.log("TT - Jail | Achievements");

		let show_completed = settings.achievements.completed;
		let personalstats = userdata.personalstats;

		if (!settings.achievements.show) return;

		// object of all the achievements on this page
		const achievements = {
			Busts: {
				stats: personalstats.peoplebusted,
				keyword: "bust",
			},
			Bails: {
				stats: personalstats.peoplebought,
				keyword: "bails",
			},
		};

		displayAchievements(achievements, show_completed);
	});
});
