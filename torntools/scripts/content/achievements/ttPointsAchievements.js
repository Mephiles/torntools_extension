requireDatabase().then(() => {
	requireNavbar().then(() => {
		console.log("TT - Points Building | Achievements");

		let show_completed = settings.achievements.completed;
		let personalstats = userdata.personalstats;

		if (!settings.achievements.show) return;

		// object of all the achievements on this page
		const achievements = {
			"Refill Casino": {
				stats: personalstats.tokenrefills,
				keyword: "refill",
				incl: ["casino"],
			},
			"Refill Energy": {
				stats: personalstats.refills,
				keyword: "refill",
				incl: ["energy"],
			},
			"Refill Nerve": {
				stats: personalstats.nerverefills,
				keyword: "refill",
				incl: ["nerve"],
			},
		};

		displayAchievements(achievements, show_completed);
	});
});
