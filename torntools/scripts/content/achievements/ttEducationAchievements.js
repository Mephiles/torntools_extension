requireDatabase().then(() => {
	requireNavbar().then(() => {
		console.log("TT - Education | Achievements");

		let show_completed = settings.achievements.completed;
		let education = userdata.education_completed;

		let highestStat = userdata.manual_labor;
		if (userdata.intelligence > highestStat) highestStat = userdata.intelligence;
		if (userdata.endurance > highestStat) highestStat = userdata.endurance;

		if (!settings.achievements.show) return;

		// object of all the achievements on this page
		const achievements = {
			"Biology Bachelor": {
				stats: education.includes(42) ? 1 : 0,
				goals: [1],
			},
			"Business Bachelor": {
				stats: education.includes(13) ? 1 : 0,
				goals: [1],
			},
			"Combat Bachelor": {
				stats: education.includes(87) ? 1 : 0,
				goals: [1],
			},
			"ICT Bachelor": {
				stats: education.includes(62) ? 1 : 0,
				goals: [1],
			},
			"General Bachelor": {
				stats: education.includes(121) ? 1 : 0,
				goals: [1],
			},
			"Fitness Bachelor": {
				stats: education.includes(111) ? 1 : 0,
				goals: [1],
			},
			"History Bachelor": {
				stats: education.includes(21) ? 1 : 0,
				goals: [1],
			},
			"Law Bachelor": {
				stats: education.includes(102) ? 1 : 0,
				goals: [1],
			},
			"Mathematics Bachelor": {
				stats: education.includes(33) ? 1 : 0,
				goals: [1],
			},
			"Psychology Bachelor": {
				stats: education.includes(69) ? 1 : 0,
				goals: [1],
			},
			"Defense Bachelor": {
				stats: education.includes(42) ? 1 : 0,
				goals: [1],
			},
			"Sports Bachelor": {
				stats: education.includes(51) ? 1 : 0,
				goals: [1],
			},
			"Tough (Man)": {
				stats: userdata.manual_labor,
				keyword: "manual labor",
			},
			"Talented (Int)": {
				stats: userdata.intelligence,
				keyword: "intelligence",
			},
			"Tireless (End)": {
				stats: userdata.endurance,
				keyword: "endurance",
				excl: ["challenge"],
			},
			"10k in any stat": {
				stats: highestStat,
				goals: [10000],
			},
			"Complete Courses": {
				stats: education.length,
				keyword: "education courses",
			},
		};

		displayAchievements(achievements, show_completed);
	});
});
