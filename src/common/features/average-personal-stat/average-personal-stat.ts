import { settings } from "@common/utils/data/database";
import { mobile } from "@common/utils/functions/dom.ts";
import { findAllElements } from "@common/utils/functions/find-elements";
import { formatNumber } from "@common/utils/functions/formatting.ts";
import { addFetchListener } from "@common/utils/functions/listeners";
import { getPageStatus } from "@common/utils/functions/torn";
import { ExecutionTiming, Feature } from "@features/feature";
import styles from "./average-personal-stat.module.css";

interface TornInternalGraphDataResponse {
	definitions: Record<string, string>;
	data: Record<
		string,
		{
			uid: number;
			data: { time: number; value: number }[];
		}[]
	>;
}

function initializeListeners() {
	addFetchListener(async ({ detail: { page, json, fetch } }) => {
		if (page !== "personalstats") return;

		if (fetch.body?.step === "getGraphData") {
			calculateStatsAverage(json as TornInternalGraphDataResponse);
		}
	});
}

function calculateStatsAverage(graphData: TornInternalGraphDataResponse) {
	Object.values(graphData.data).forEach((statData) => {
		statData.forEach((user, index) => {
			const element = findAllElements("div[class^='titleItem']")[index + 2];
			if (!element) return;

			const lowerPoint = user.data[0];
			const upperPoint = user.data.at(-1)!;

			const days = (upperPoint.time - lowerPoint.time) / (60 * 60 * 24);
			const average = (upperPoint.value - lowerPoint.value) / days;

			const userName = graphData.definitions[user.uid];

			element.classList.add(styles.averageStat);
			element.textContent = mobile
				? `${userName} (${formatNumber(average, { decimals: average > 1000 ? 0 : 1 })}/d)`
				: `${userName} (${formatNumber(average, { decimals: 2 })} per day)`;
			element.setAttribute("title", `${formatNumber(average, { decimals: 2 })} per day`);
		});
	});
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
		initializeListeners();
	}

	override execute() {
		initializeListeners();
	}

	override storageKeys() {
		return ["settings.pages.profile.avgpersonalstats"];
	}
}
