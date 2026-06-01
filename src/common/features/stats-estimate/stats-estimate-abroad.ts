import { Feature } from "@features/feature";
import { FEATURE_MANAGER } from "@utils/context";
import { settings } from "@utils/data/database";
import { hasAPIData } from "@utils/functions/api";
import { findAllElements } from "@utils/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@utils/functions/listeners";
import { requireElement } from "@utils/functions/requires";
import { getPageStatus, isAbroad } from "@utils/functions/torn";
import { StatsEstimate } from "./stats-estimate";

const statsEstimate = new StatsEstimate("Abroad People", true);
let triggerFilter: number | undefined;

function registerListeners() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.FILTER_APPLIED].push(() => {
		if (!FEATURE_MANAGER.isEnabled(StatsEstimateAbroadFeature)) return;

		if (triggerFilter) clearTimeout(triggerFilter);
		triggerFilter = setTimeout(showEstimates, 500);
	});
}

async function startFeature() {
	if (settings.pages.travel.peopleFilter) {
		const list = document.querySelector(".user-info-list-wrap");
		if (!list) return;
	}

	await showEstimates();
}

async function showEstimates() {
	await requireElement(".users-list");

	statsEstimate.clearQueue();
	statsEstimate.showEstimates(
		".users-list > li",
		(row) => ({
			id: parseInt(row.querySelector<HTMLAnchorElement>(".user.name[href*='profiles.php']").href.match(/(?<=XID=).*/)[0]),
			level: parseInt(row.querySelector(".level").textContent),
		}),
		{ hasFilter: true },
	);
}

function removeEstimates() {
	statsEstimate.clearQueue();
	findAllElements(".tt-stats-estimate").forEach((estimate) => estimate.remove());
}

export default class StatsEstimateAbroadFeature extends Feature {
	constructor() {
		super("Stats Estimate Abroad", "travel");
	}

	precondition() {
		return getPageStatus().access && isAbroad();
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}

	isEnabled() {
		return settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.abroad;
	}

	initialise() {
		registerListeners();
	}

	async execute() {
		await startFeature();
	}

	cleanup() {
		removeEstimates();
	}

	storageKeys() {
		return ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.abroad"];
	}
}
