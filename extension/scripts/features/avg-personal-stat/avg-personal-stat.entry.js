"use strict";

(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Average Personal Stat",
		"personalstats",
		() => settings.pages.profile.avgpersonalstats,
		init,
		init,
		null,
		null,
		async () => {
			await checkDevice();
		}
	);

	function init() {
		addFetchListener((event) => {
			const {
				page,
				json,
				fetch: { body },
			} = event.detail;
			if (page !== "personalstats") return;
			if (body.includes("getGraphData")) {
				const graphData = json;
				calculateStatsAverage(graphData);
			}
		});
	}

	function calculateStatsAverage(graphData) {
		for (const stat in graphData.data) {
			const statData = graphData.data[stat];
			let userIndex = 2;
			for (const user of statData) {
				// Get Relevant Data
				const uid = user.uid;
				const userName = graphData.definitions[uid];
				const lowerTime = user.data[0].time;
				const lowerVal = user.data[0].value;
				const userDatalen = user.data.length;
				const upperTime = user.data[userDatalen - 1].time;
				const upperVal = user.data[userDatalen - 1].value;

				// Calcualte Average
				const timeLength = (upperTime - lowerTime) / (60 * 60 * 24);
				const difference = upperVal - lowerVal;
				const avg = difference / timeLength;
				const roundedAvg = avg.toFixed(2); // Rounds to 2 decimal places
				const formattedAvg = roundedAvg.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

				// Insert the data
				const element = document.querySelectorAll("div[class^='titleItem']")[userIndex];
				element.textContent = `${userName} (${formattedAvg} per day)`;
				userIndex++;
			}
		}
	}
})();
