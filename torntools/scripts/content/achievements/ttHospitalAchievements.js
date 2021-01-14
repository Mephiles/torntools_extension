requireDatabase().then(() => {
	requireNavbar().then(() => {
		console.log("TT - Hospital | Achievements");

		let show_completed = settings.achievements.completed;
		let personalstats = userdata.personalstats;

		if (!settings.achievements.show) return;

		// object of all the achievements on this page
		let achievements = {
			Revives: {
				stats: personalstats.revives,
				keyword: "revive",
				excl: ["within"],
			},
		};

		displayAchievements(achievements, show_completed);
	});
});
