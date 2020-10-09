requireDatabase().then(() => {
	requireNavbar().then(() => {
		console.log("TT - City | Achievements");

		let show_completed = settings.achievements.completed;
		let personalstats = userdata.personalstats;

		if (!settings.achievements.show) return;

		// object of all the achievements on this page
		const achievements = {
			"City finds": {
				stats: personalstats.cityfinds,
				keyword: "city",
				incl: ["find", "items"],
			},
		};

		displayAchievements(achievements, show_completed);
	});
});
