import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { addXHRListener } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus } from "@/utils/common/functions/torn";
import { StatsEstimate } from "./stats-estimate";

const statsEstimate = new StatsEstimate("HOF", true);

function registerListeners() {
	addXHRListener(async ({ detail: { page, xhr } }) => {
		if (!FEATURE_MANAGER.isEnabled(StatsEstimateHOFFeature)) return;
		if (page !== "halloffame") return;

		const params = new URLSearchParams(xhr.requestBody);
		const step = params.get("step");
		if (step !== "getListHallOfFame") return;

		const type = params.get("type");
		if (type === "battlestats" || type === "respect") return;

		await requireElement(".players-list .ajax-placeholder", { invert: true });

		showEstimates().catch(() => console.error(`Failed to load stats estimate for the '${type}' list.`));
	});
}

async function showEstimates() {
	await requireElement("[class*='tableBody___'] > [class*='tableRow___']");

	const hofType = document.querySelector("[class*='buttonWrapper___'][class*='selected___'] [class*='title___']").textContent.toLowerCase();
	if (["battle stats", "faction respect", "faction chains", "faction rank"].includes(hofType)) return;

	const levelIndex = Array.from(document.querySelector("[class*='tableHead___'] [class*='tableRow___']").children).findIndex(
		(title) => title.textContent === "level",
	);
	if (levelIndex === -1) return;

	statsEstimate.clearQueue();
	statsEstimate.showEstimates(
		"[class*='tableBody___'] > [class*='tableRow___']",
		(row) => ({
			id: parseInt(row.querySelector<HTMLAnchorElement>("a[href*='profiles.php']").href.match(/(?<=XID=).*/)[0]),
			level: parseInt(row.querySelector(`td:nth-child(${levelIndex + 1})`).textContent),
		}),
		{
			generator: () => {
				const field = elementBuilder({ type: "div", class: "tt-stats-estimate" });

				return {
					field,
					section: elementBuilder({
						type: "tr",
						children: [elementBuilder({ type: "td", attributes: { colspan: 5 }, children: [field] })],
					}),
				};
			},
		},
	);
}

function removeEstimates() {
	statsEstimate.clearQueue();
	findAllElements(".tt-stats-estimate").forEach((estimate) => estimate.remove());
}

export default class StatsEstimateHOFFeature extends Feature {
	constructor() {
		super("Stats Estimate HOF", "halloffame");
	}

	precondition() {
		return getPageStatus().access;
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}

	isEnabled() {
		return settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.hof;
	}

	initialise() {
		registerListeners();
	}

	async execute() {
		await showEstimates();
	}

	cleanup() {
		removeEstimates();
	}

	storageKeys(): string[] {
		return ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.hof"];
	}
}
