requireDatabase().then(() => {
	requireNavbar().then(() => {
		console.log("TT - Items | Achievements");

		let show_completed = settings.achievements.completed;
		let personalstats = userdata.personalstats;

		if (!settings.achievements.show) return;

		// object of all the achievements on this page
		const achievements = {
			Cannabis: {
				stats: personalstats.cantaken,
				keyword: "cannabis",
				incl: ["use"],
			},
			Ecstasy: {
				stats: personalstats.exttaken,
				keyword: "ecstasy",
			},
			Ketamine: {
				stats: personalstats.kettaken,
				keyword: "ketamine",
			},
			LSD: {
				stats: personalstats.lsdtaken,
				keyword: "lsd",
			},
			Opium: {
				stats: personalstats.opitaken,
				keyword: "opium",
			},
			Shrooms: {
				stats: personalstats.shrtaken,
				keyword: "shrooms",
			},
			Speed: {
				stats: personalstats.spetaken,
				keyword: "speed",
				excl: ["gain"],
			},
			PCP: {
				stats: personalstats.pcptaken,
				keyword: "pcp",
			},
			Xanax: {
				stats: personalstats.xantaken,
				keyword: "xanax",
			},
			Vicodin: {
				stats: personalstats.victaken,
				keyword: "vicodin",
			},
			Viruses: {
				stats: personalstats.virusescoded,
				keyword: "viruses",
			},
			"Fill blood": {
				stats: personalstats.bloodwithdrawn,
				keyword: "blood",
				incl: ["fill"],
			},
			"Items dumped": {
				stats: personalstats.itemsdumped,
				keyword: "items",
				incl: ["trash"],
			},
			Alcohol: {
				stats: personalstats.alcoholused,
				keyword: "alcohol",
			},
			Candy: {
				stats: personalstats.candyused,
				keyword: "candy",
			},
			"Medical items used": {
				stats: personalstats.medicalitemsused,
				keyword: "medical items",
				incl: ["use"],
			},
			"Energy drinks used": {
				stats: personalstats.energydrinkused,
				keyword: "energy drink",
			},
		};

		displayAchievements(achievements, show_completed);
	});
});
