import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { getPageStatus } from "@/utils/common/functions/torn";
import { settings } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { findAllElements } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { addXHRListener } from "@/utils/common/functions/listeners";
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
	await requireElement(".players-list > li");
	await requireElement(".players-list > li .ajax-preloader", { invert: true });

	const hofType = document.querySelector(".hall-of-fame-list-wrap .hall-of-fame-wrap").classList[1];
	if (["battle", "respect", "factionchains", "factionrank"].includes(hofType)) return;

	const levelIndex = [...document.querySelector(".table-titles").children].findIndex((title) => title.textContent === "Level");
	if (levelIndex === -1) return;

	statsEstimate.clearQueue();
	statsEstimate.showEstimates(".players-list > li:not(.empty)", (row) => ({
		id: parseInt(row.querySelector<HTMLAnchorElement>(".user.name[href*='profiles.php']").href.match(/(?<=XID=).*/)[0]),
		level: parseInt(row.querySelector(`.player-info > li:nth-child(${levelIndex + 1})`).textContent),
	}));
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
