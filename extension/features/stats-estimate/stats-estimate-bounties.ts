import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { findAllElements, getHashParameters } from "@/utils/common/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus } from "@/utils/common/functions/torn";
import { StatsEstimate } from "./stats-estimate";

const statsEstimate = new StatsEstimate("Bounties", true);

function registerListeners() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.SWITCH_PAGE].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(StatsEstimateBountiesFeature) || settings.pages.bounties.filter) return;

		await showEstimates();
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.FILTER_APPLIED].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(StatsEstimateBountiesFeature)) return;

		await showEstimates();
	});
}

async function startFeature() {
	if (settings.pages.bounties.filter) {
		const list = document.querySelector(".bounties-list");
		if (!list?.classList.contains("tt-filtered")) return;
	}

	await showEstimates();
}

async function showEstimates() {
	await requireElement(".bounties-list");

	const startParam = parseInt(getHashParameters().get("start")) || 0;
	const start = parseInt(getHashParameters(document.querySelector<HTMLAnchorElement>(".claim a").href.split("#!")[1] ?? "").get("start")) || 0;
	if (start !== startParam) return;

	statsEstimate.clearQueue();
	statsEstimate.showEstimates(
		".bounties-list > li[data-id]",
		(row) => ({
			id: parseInt(row.querySelector<HTMLAnchorElement>(".target a").href.match(/(\d+)/g)?.at(-1)),
			level: parseInt(row.querySelector(".level").textContent.replaceAll("\n", "").split(":").at(-1)!.trim()),
		}),
		{ hasFilter: true },
	);
}

function removeEstimates() {
	statsEstimate.clearQueue();
	findAllElements(".tt-stats-estimate").forEach((estimate) => estimate.remove());
}

export default class StatsEstimateBountiesFeature extends Feature {
	constructor() {
		super("Stats Estimate Bounties", "bounties");
	}

	precondition() {
		return getPageStatus().access;
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}

	isEnabled() {
		return settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.bounties;
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
		return ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.bounties"];
	}
}
