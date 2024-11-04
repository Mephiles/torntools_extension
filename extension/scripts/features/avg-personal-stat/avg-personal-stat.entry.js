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
		for (let stat in graphData.data) {
			const statData = graphData.data[stat];
			let userIndex = 2;
			for (let user of statData) {
				// Get Relevant Data
				let uid = user.uid;
				let userName = graphData.definitions[uid];
				let lowerTime = user.data[0].time;
				let lowerVal = user.data[0].value;
				let userDatalen = user.data.length;
				let upperTime = user.data[userDatalen - 1].time;
				let upperVal = user.data[userDatalen - 1].value;

				// Calcualte Average
				let timeLength = (upperTime - lowerTime) / (60 * 60 * 24);
				let difference = upperVal - lowerVal;
				let avg = difference / timeLength;
				let roundedAvg = avg.toFixed(2); // Rounds to 2 decimal places
				let formattedAvg = roundedAvg.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

				// Insert the data
				let element = document.querySelectorAll("div[class^='titleItem']")[userIndex];
				element.textContent = `${userName} ( ${formattedAvg} per day )`;
				userIndex++;
			}
		}
	}
})();
