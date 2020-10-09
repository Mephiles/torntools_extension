requireDatabase().then(() => {
	requireNavbar().then(() => {
		console.log("TT - Travel | Achievements");

		let show_completed = settings.achievements.completed;
		let personalstats = userdata.personalstats;

		if (!settings.achievements.show) return;

		// object of all the achievements on this page
		const achievements = {
			Argentina: {
				stats: personalstats.argtravel,
				keyword: "argentina",
			},
			Canada: {
				stats: personalstats.cantravel,
				keyword: "canada",
			},
			Cayman: {
				stats: personalstats.caytravel,
				keyword: "cayman",
			},
			China: {
				stats: personalstats.chitravel,
				keyword: "china",
			},
			UAE: {
				stats: personalstats.dubtravel,
				keyword: "united arab emirates",
			},
			Hawaii: {
				stats: personalstats.hawtravel,
				keyword: "hawaii",
			},
			Japan: {
				stats: personalstats.japtravel,
				keyword: "japan",
			},
			UK: {
				stats: personalstats.lontravel,
				keyword: "kingdom",
			},
			Mexico: {
				stats: personalstats.mextravel,
				keyword: "mexico",
			},
			"South Africa": {
				stats: personalstats.soutravel,
				keyword: "south africa",
			},
			Switzerland: {
				stats: personalstats.switravel,
				keyword: "switzerland",
			},
			Total: {
				stats: personalstats.traveltimes,
				keyword: "travel",
				excl: ["to"],
			},
			"Time (days)": {
				stats: secondsToDays(personalstats.traveltime),
				keyword: "spend",
				incl: ["days", "air"],
			},
			"Items bought abroad": {
				stats: personalstats.itemsboughtabroad,
				keyword: "import",
				incl: ["items"],
			},
		};

		displayAchievements(achievements, show_completed);
	});
});
