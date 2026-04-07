import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { getPageStatus } from "@/utils/common/functions/torn";
import { settings } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { findAllElements } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { StatsEstimate } from "./stats-estimate";

const statsEstimate = new StatsEstimate("Userlist", true);

let triggerFilter: number | undefined;

function registerListeners() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.USERLIST_SWITCH_PAGE].push(() => {
		if (!FEATURE_MANAGER.isEnabled(StatsEstimateUserlistFeature) || settings.pages.userlist.filter) return;

		showEstimates();
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.FILTER_APPLIED].push(() => {
		if (!FEATURE_MANAGER.isEnabled(StatsEstimateUserlistFeature)) return;

		if (triggerFilter) clearTimeout(triggerFilter);
		triggerFilter = setTimeout(showEstimates, 500);
	});
}

async function startFeature() {
	if (settings.pages.userlist.filter) {
		const list = document.querySelector(".user-info-list-wrap");
		if (!list || list.querySelector(".ajax-placeholder, .ajax-preloader")) return;
	}

	await showEstimates();
}

async function showEstimates() {
	await requireElement(".user-info-list-wrap");
	await requireElement(".user-info-list-wrap .ajax-placeholder, .user-info-list-wrap .ajax-preloader", { invert: true });

	statsEstimate.clearQueue();
	statsEstimate.showEstimates(
		".user-info-list-wrap > li",
		(row) => ({
			id: parseInt(row.querySelector<HTMLAnchorElement>(".user.name[href*='profiles.php']").href.match(/(?<=XID=).*/)[0]),
			level: parseInt(row.querySelector(".level").textContent.replaceAll("\n", "").split(":").at(-1)!.trim()),
		}),
		{ hasFilter: true }
	);
}

function removeEstimates() {
	statsEstimate.clearQueue();
	findAllElements(".tt-stats-estimate").forEach((estimate) => estimate.remove());
}

export default class StatsEstimateUserlistFeature extends Feature {
	constructor() {
		super("Stats Estimate Userlist", "userlist");
	}

	precondition() {
		return getPageStatus().access;
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}

	isEnabled() {
		return settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.userlist;
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

	storageKeys(): string[] {
		return ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.userlist"];
	}
}
