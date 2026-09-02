import { settings } from "@common/utils/data/database";
import { findAllElements } from "@common/utils/functions/find-elements";
import { addFetchListener } from "@common/utils/functions/listeners";
import { getPageStatus } from "@common/utils/functions/torn";
import { ExecutionTiming, Feature } from "@features/feature";

function init() {
	addFetchListener((event) => {
		const {
			page,
			json,
			fetch: { body },
		} = event.detail;
		if (page !== "personalstats") return;

		if (body?.step === "getGraphData") {
			calculateStatsAverage(json);
		}
	});
}

function calculateStatsAverage(graphData: any) {
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

			// Calculate Average
			const timeLength = (upperTime - lowerTime) / (60 * 60 * 24);
			const difference = upperVal - lowerVal;
			const avg = difference / timeLength;
			const roundedAvg = avg.toFixed(2); // Rounds to 2 decimal places
			const formattedAvg = roundedAvg.replaceAll(/\B(?=(\d{3})+(?!\d))/g, ",");

			// Insert data
			const element = findAllElements("div[class^='titleItem']")[userIndex];
			if (element) element.textContent = `${userName} (${formattedAvg} per day)`;
			userIndex++;
		}
	}
}

export default class AveragePersonalStatFeature extends Feature {
	constructor() {
		super("Average Personal Stat", "personalstats", ExecutionTiming.IMMEDIATELY);
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.profile.avgpersonalstats;
	}

	override initialise() {
		init();
	}

	override execute() {
		init();
	}

	override storageKeys() {
		return ["settings.pages.profile.avgpersonalstats"];
	}

	override requiresScreenInformation(): boolean {
		return false;
	}
}
