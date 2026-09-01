import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { isElement } from "@common/utils/functions/dom";
import { convertToNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
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
			) &&
			FEATURE_MANAGER.isEnabled(StatsEstimateTargetsFeature)
		) {
			showEstimates();
		}
	});

	tableObserver = new MutationObserver((mutations) => {
		if (
			mutations.some((mutation) =>
				Array.from(mutation.addedNodes)
					.filter(isElement)
					.some((node) => node.tagName === "UL"),
			) &&
			FEATURE_MANAGER.isEnabled(StatsEstimateTargetsFeature)
		) {
			showEstimates();
			listObserver.observe(document.querySelector(".tableWrapper > ul"), { childList: true });
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

export default class StatsEstimateTargetsFeature extends Feature {
	constructor() {
		super("Stats Estimate Targets", "targets");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}

	override isEnabled() {
		return settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.targets;
	}

	override async initialise() {
		await registerListeners();
	}

	override async execute() {
		await showEstimates();
	}

	override storageKeys(): string[] {
		return ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.targets"];
	}
}
