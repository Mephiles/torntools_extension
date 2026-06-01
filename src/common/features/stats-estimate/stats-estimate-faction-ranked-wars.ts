import { getFactionSubpage, isInternalFaction } from "@common/pages/factions-page";
import { Feature } from "@features/feature";
import { FEATURE_MANAGER } from "@utils/context";

import { settings } from "@utils/data/database";
import { hasAPIData } from "@utils/functions/api";
import { findAllElements, isElement } from "@utils/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@utils/functions/listeners";
import { requireElement } from "@utils/functions/requires";
import { getPageStatus } from "@utils/functions/torn";
import { StatsEstimate } from "./stats-estimate";

const statsEstimate = new StatsEstimate("Faction Ranked Wars", true);

let observer: MutationObserver | undefined;

function registerListeners() {
	if (isInternalFaction) {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_MAIN].push(() => {
			if (!FEATURE_MANAGER.isEnabled(StatsEstimateFactionRankedWarsFeature)) return;

			observeWars();
		});
	}
}

async function startFeature() {
	if (isInternalFaction && getFactionSubpage() !== "main") return;

	observeWars();
}

function observeWars() {
	if (observer) observer.disconnect();

	if (location.hash.includes("/war/rank")) requireElement(".f-war-list > .descriptions").then(() => showEstimates());

	requireElement("ul.f-war-list").then(() => {
		observer = new MutationObserver((mutations) => {
			if (!mutations.some((mutation) => Array.from(mutation.addedNodes).some((node) => isElement(node) && node.classList.contains("descriptions"))))
				return;

			showEstimates();
		});
		observer.observe(document.querySelector("ul.f-war-list"), { childList: true });
	});
}

function showEstimates() {
	const list = document.querySelector(".f-war-list:has([class*='warListItem___'][class*='active___'] [class*='rankBox'])");
	if (!list) return;

	requireElement(".faction-war .members-list").then(() => {
		statsEstimate.clearQueue();
		statsEstimate.showEstimates(
			".faction-war .members-list > li.enemy, .faction-war .members-list > li.your",
			(row) => {
				return {
					id: parseInt(row.querySelector<HTMLAnchorElement>("[class*='honorWrap__'] > a").href.split("XID=")[1]),
					level: parseInt(row.querySelector(".level").textContent.trim()),
				};
			},
			{
				hasFilter: true,
				placement: (row) => row.querySelector(".clear"),
			},
		);
	});
}

function removeEstimates() {
	observer?.disconnect();
	observer = undefined;

	statsEstimate.clearQueue();
	findAllElements(".tt-stats-estimate").forEach((estimate) => estimate.remove());
}

export default class StatsEstimateFactionRankedWarsFeature extends Feature {
	constructor() {
		super("Stats Estimate Faction Ranked Wars", "factions");
	}

	precondition() {
		return getPageStatus().access;
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}

	isEnabled() {
		return settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.rankedWars;
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
		return ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.rankedWars"];
	}
}
