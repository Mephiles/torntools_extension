import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findElement } from "@common/utils/functions/find-elements";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import { StatsEstimate } from "./stats-estimate";

const statsEstimate = new StatsEstimate("Userlist", true);

let triggerFilter: number | undefined;

function registerListeners() {
	addCustomListener(EVENT_CHANNELS.USERLIST_SWITCH_PAGE, () => {
		if (!FEATURE_MANAGER.isEnabled(StatsEstimateUserlistFeature) || settings.pages.userlist.filter) return;

		showEstimates();
	});
	addCustomListener(EVENT_CHANNELS.FILTER_APPLIED, () => {
		if (!FEATURE_MANAGER.isEnabled(StatsEstimateUserlistFeature)) return;

		if (triggerFilter) clearTimeout(triggerFilter);
		triggerFilter = setTimeout(showEstimates, 500);
	});
}

async function startFeature() {
	if (settings.pages.userlist.filter) {
		const list = findElement(".user-info-list-wrap", true);
		if (!list || findElement(".ajax-placeholder, .ajax-preloader", list, true)) return;
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
			id: parseInt(findElement<HTMLAnchorElement>(".user.name[href*='profiles.php']", row).href.match(/(?<=XID=).*/)![0]),
			level: parseInt(findElement(".level", row).textContent.replaceAll("\n", "").split(":").at(-1)!.trim()),
		}),
		{ hasFilter: true },
	);
}

export default class StatsEstimateUserlistFeature extends Feature {
	constructor() {
		super("Stats Estimate Userlist", "userlist");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}

	override isEnabled() {
		return settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.userlist;
	}

	override initialise() {
		registerListeners();
	}

	override async execute() {
		await startFeature();
	}

	override storageKeys(): string[] {
		return ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.userlist"];
	}
}
