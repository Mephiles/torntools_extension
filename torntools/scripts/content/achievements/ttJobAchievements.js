requireDatabase().then(() => {
	requireNavbar().then(() => {
		console.log("TT - Job | Achievements");

		let show_completed = settings.achievements.completed;

		if (!settings.achievements.show) return;

		// object of all the achievements on this page
		const achievements = {
			Intelligence: {
				stats: userdata.intelligence,
				keyword: "intelligence",
			},
			Manual: {
				stats: userdata.manual_labor,
				keyword: "manual",
			},
			Endurance: {
				stats: userdata.endurance,
				keyword: "endurance",
				incl: ["attain"],
			},
		};

		displayAchievements(achievements, show_completed);
	});
});
