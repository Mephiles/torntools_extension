requireDatabase().then(() => {
	requireNavbar().then(() => {
		console.log("TT - Gym | Achievements");

		let show_completed = settings.achievements.completed;

		if (!settings.achievements.show) return;

		// object of all the achievements on this page
		const achievements = {
			Strength: {
				stats: parseInt(userdata.strength),
				keyword: "strength",
				incl: ["gain"],
			},
			Speed: {
				stats: parseInt(userdata.speed),
				keyword: "speed",
				incl: ["gain"],
			},
			Defense: {
				stats: parseInt(userdata.defense),
				keyword: "defense",
				incl: ["gain"],
			},
			Dexterity: {
				stats: parseInt(userdata.dexterity),
				keyword: "dexterity",
				incl: ["gain"],
			},
			Total: {
				stats: parseInt(userdata.total),
				keyword: "total stats",
			},
		};

		displayAchievements(achievements, show_completed);
	});
});
