import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { findAllElements, isElement } from "@/utils/common/functions/dom";
import { convertToNumber } from "@/utils/common/functions/formatting";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus } from "@/utils/common/functions/torn";
import { StatsEstimate } from "./stats-estimate";

const statsEstimate = new StatsEstimate("Targets", true);

let listObserver: MutationObserver | undefined;
let tableObserver: MutationObserver | undefined;

async function registerListeners() {
	listObserver = new MutationObserver((mutations) => {
		if (
			mutations.some((mutation) =>
				Array.from(mutation.addedNodes)
					.filter(isElement)
					.some((node) => node.matches("li[class*='tableRow__']")),
			)
		) {
			if (FEATURE_MANAGER.isEnabled(StatsEstimateTargetsFeature)) showEstimates();
		}
	});

	tableObserver = new MutationObserver((mutations) => {
		if (
			mutations.some((mutation) =>
				Array.from(mutation.addedNodes)
					.filter(isElement)
					.some((node) => node.tagName === "UL"),
			)
		) {
			if (FEATURE_MANAGER.isEnabled(StatsEstimateTargetsFeature)) {
				showEstimates();
				listObserver.observe(document.querySelector(".tableWrapper > ul"), { childList: true });
			}
		}
	});

	tableObserver.observe(await requireElement(".tableWrapper"), { childList: true });
	listObserver.observe(await requireElement(".tableWrapper > ul"), { childList: true });
}

async function showEstimates() {
	document.body.classList.add("tt-transparent-estimates");
	await requireElement(".tableWrapper ul > li");

	statsEstimate.clearQueue();
	statsEstimate.showEstimates(
		".tableWrapper ul > li",
		(row) => ({
			id: parseInt(row.querySelector<HTMLAnchorElement>("[class*='userInfoBox__'] a[href*='profiles.php']").href.match(/(?<=XID=).*/)[0]),
			level: convertToNumber(row.querySelector("[class*='level__']").textContent),
		}),
		{ hasFilter: true },
	);
}

function removeEstimates() {
	statsEstimate.clearQueue();
	findAllElements(".tt-stats-estimate").forEach((estimate) => estimate.remove());
	document.body.classList.remove("tt-transparent-estimates");

	listObserver?.disconnect();
	tableObserver?.disconnect();
}

export default class StatsEstimateTargetsFeature extends Feature {
	constructor() {
		super("Stats Estimate Targets", "targets");
	}

	precondition() {
		return getPageStatus().access;
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}

	isEnabled() {
		return settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.targets;
	}

	async initialise() {
		await registerListeners();
	}

	async execute() {
		await showEstimates();
	}

	cleanup() {
		removeEstimates();
	}

	storageKeys(): string[] {
		return ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.targets"];
	}
}
