import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { getHashParameters } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findElement } from "@common/utils/functions/find-elements";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import { StatsEstimate } from "./stats-estimate";

const statsEstimate = new StatsEstimate("Bounties", true);

function registerListeners() {
	addCustomListener(EVENT_CHANNELS.SWITCH_PAGE, async () => {
		if (!FEATURE_MANAGER.isEnabled(StatsEstimateBountiesFeature) || settings.pages.bounties.filter) return;

		await showEstimates();
	});
	addCustomListener(EVENT_CHANNELS.FILTER_APPLIED, async () => {
		if (!FEATURE_MANAGER.isEnabled(StatsEstimateBountiesFeature)) return;

		await showEstimates();
	});
}

async function startFeature() {
	if (settings.pages.bounties.filter) {
		const list = findElement(".bounties-list", true);
		if (!list?.classList.contains("tt-filtered")) return;
	}

	await showEstimates();
}

async function showEstimates() {
	await requireElement(".bounties-list");

	const startParam = parseInt(getHashParameters().get("start")) || 0;
	const start = parseInt(getHashParameters(findElement<HTMLAnchorElement>(".claim a").href.split("#!")[1] ?? "").get("start")) || 0;
	if (start !== startParam) return;

	statsEstimate.clearQueue();
	statsEstimate.showEstimates(
		".bounties-list > li[data-id]",
		(row) => ({
			id: parseInt(findElement<HTMLAnchorElement>(".target a", row).href.match(/(\d+)/g)?.at(-1)),
			level: parseInt(findElement(".level", row).textContent.replaceAll("\n", "").split(":").at(-1)!.trim()),
		}),
		{ hasFilter: true },
	);
}

export default class StatsEstimateBountiesFeature extends Feature {
	constructor() {
		super("Stats Estimate Bounties", "bounties");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}

	override isEnabled() {
		return settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.bounties;
	}

	override initialise() {
		registerListeners();
	}

	override async execute() {
		await startFeature();
	}

	override storageKeys(): string[] {
		return ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.bounties"];
	}
}
