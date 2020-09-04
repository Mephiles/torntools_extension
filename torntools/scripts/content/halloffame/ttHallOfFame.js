requireDatabase(true).then(() => {
	console.log("TT - Hall Of Fame");

	addXHRListener((event) => {
		const { page, xhr } = event.detail;
		if (page !== "halloffame") return;

		const params = new URLSearchParams(xhr.requestBody);
		if (params.get("step") !== "getListHallOfFame") return;

		hofLoaded().then(() => {
			if (settings.scripts.stats_estimate.global && settings.scripts.stats_estimate.hall_of_fame)
				showStatsEstimates();
		});
	});

	hofLoaded().then(() => {
		if (settings.scripts.stats_estimate.global && settings.scripts.stats_estimate.hall_of_fame)
			showStatsEstimates();
	});
});

function hofLoaded() {
	return requireElement(".hall-of-fame-wrap > .players-list > li > .clear");
}

function showStatsEstimates() {
	estimateStatsInList(".hall-of-fame-wrap > .players-list > li", (row) => {
		return {
			userId: row.find(".player-info .player a.user.name").getAttribute("href").match(/profiles\.php\?XID=([0-9]*)/i)[1],
		};
	});
}