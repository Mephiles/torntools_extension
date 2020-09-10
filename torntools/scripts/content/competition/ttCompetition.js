requireDatabase().then(() => {
	console.log("TT - Competition");

	addXHRListener((event) => {
		const { page, uri, xhr } = event.detail;
		if (page !== "competition") return;

		const params = getHashParameters();

		if (params.get("p") === "team") {
			listLoaded().then(showStatsEstimates);
		}
	});

	if (getHashParameters().get("p") === "team") {
		listLoaded().then(showStatsEstimates);
	}
});

function listLoaded() {
	return requireElement(".competition-list");
}

function showStatsEstimates() {
	estimateStatsInList("ul.competition-list > li", (row) => {
		return {
			userId: (row.find("a.user.name").getAttribute("data-placeholder") || row.find("a.user.name > span").getAttribute("title")).match(/.* \[([0-9]*)]/i)[1],
		};
	});
}