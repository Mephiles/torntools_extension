requireDatabase().then(() => {
	requireNavbar().then(() => {
		console.log("TT - Home | Achievements");

		let show_completed = settings.achievements.completed;
		let personalstats = userdata.personalstats;

		if (!settings.achievements.show) return;

		// gather all perks
		let perks =
			userdata.company_perks.length +
			userdata.education_perks.length +
			userdata.enhancer_perks.length +
			userdata.faction_perks.length +
			userdata.job_perks.length +
			userdata.merit_perks.length +
			userdata.property_perks.length +
			userdata.stock_perks.length;

		// object of all the achievements on this page
		const achievements = {
			Perks: {
				stats: perks,
				keyword: "personal perks",
			},
			Awards: {
				stats: personalstats.awards,
				keyword: "total awards",
			},
			"Married (days)": {
				stats: userdata.married.duration,
				keyword: "stay married",
			},
			"Points sold": {
				stats: personalstats.pointssold,
				keyword: "points on the market",
			},
			Activity: {
				stats: secondsToHours(personalstats.useractivity),
				keyword: "activity",
			},
			"Bazaar buyers": {
				stats: personalstats.bazaarcustomers,
				keyword: "customers buy from your bazaar",
			},
			"Stock payouts": {
				stats: personalstats.stockpayouts,
				keyword: "payouts",
			},
			"Donator (days)": {
				stats: personalstats.daysbeendonator,
				keyword: "donator",
			},
			"Energy refills": {
				stats: personalstats.refills,
				keyword: "refill",
				incl: ["energy"],
			},
			"Nerve refills": {
				stats: personalstats.nerverefills,
				keyword: "refill",
				incl: ["nerve"],
			},
			"Token refills": {
				stats: personalstats.tokenrefills,
				keyword: "refill",
				incl: ["nerve"],
			},
			Networth: {
				stats: personalstats.networth,
				keyword: "networth",
			},
		};

		displayAchievements(achievements, show_completed);
	});
});
