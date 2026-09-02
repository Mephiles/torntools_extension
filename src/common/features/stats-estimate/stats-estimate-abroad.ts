import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findElement } from "@common/utils/functions/find-elements";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus, isAbroad } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import { StatsEstimate } from "./stats-estimate";

const statsEstimate = new StatsEstimate("Abroad People", true);
let triggerFilter: number | undefined;

function registerListeners() {
	addCustomListener(EVENT_CHANNELS.FILTER_APPLIED, () => {
		if (!FEATURE_MANAGER.isEnabled(StatsEstimateAbroadFeature)) return;

		if (triggerFilter) clearTimeout(triggerFilter);
		triggerFilter = setTimeout(showEstimates, 500);
	});
}

async function startFeature() {
	if (settings.pages.travel.peopleFilter) {
		const list = findElement(".user-info-list-wrap", true);
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
			id: parseInt(findElement<HTMLAnchorElement>(".user.name[href*='profiles.php']", row).href.match(/(?<=XID=).*/)[0]),
			level: parseInt(findElement(".level", row).textContent),
		}),
		{ hasFilter: true },
	);
}

export default class StatsEstimateAbroadFeature extends Feature {
	constructor() {
		super("Stats Estimate Abroad", "travel");
	}

	override precondition() {
		return getPageStatus().access && isAbroad();
	}

	override requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}

	override isEnabled() {
		return settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.abroad;
	}

	override initialise() {
		registerListeners();
	}

	override async execute() {
		await startFeature();
	}

	override storageKeys() {
		return ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.abroad"];
	}
}
