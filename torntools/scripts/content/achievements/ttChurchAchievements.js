requireDatabase().then(() => {
	requireNavbar().then(() => {
		console.log("TT - Church | Achievements");

		let show_completed = settings.achievements.completed;

		if (!settings.achievements.show) return;

		// object of all the achievements on this page
		const achievements = {
			Donations: {
				stats: getDonations(),
				keyword: "church",
			},
		};

		displayAchievements(achievements, show_completed);
	});
});
