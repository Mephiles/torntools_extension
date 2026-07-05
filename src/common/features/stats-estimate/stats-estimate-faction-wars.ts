import { isDestroyed, isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { findAllElements, getHashParameters, isElement } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import { StatsEstimate } from "./stats-estimate";

const statsEstimate = new StatsEstimate("Faction Wars", true);

let observer: MutationObserver | undefined;

function registerListeners() {
	if (isInternalFaction) {
		addCustomListener(EVENT_CHANNELS.FACTION_MAIN, () => {
			if (!FEATURE_MANAGER.isEnabled(StatsEstimateFactionWarsFeature)) return;

			observeWars();
		});
	}
}

async function startFeature() {
	if (isInternalFaction && getHashParameters().has("tab")) return;
	if (!isInternalFaction && (await isDestroyed())) return;

	observeWars();
}

function observeWars() {
	if (observer) observer.disconnect();

	if (location.hash.includes("/war/") && !location.hash.includes("/war/rank")) {
		requireElement(".f-war-list > .descriptions").then(observeDescription);
	}

	requireElement("ul.f-war-list").then((warList) => {
		observer = new MutationObserver((mutations) => {
			if (
				!mutations.some((mutation) =>
					Array.from(mutation.addedNodes).some(
						(node) => isElement(node) && node.classList.contains("descriptions") && node.querySelector(".enemy-faction"),
					),
				)
			)
				return;

			observeDescription();
		});
		observer.observe(warList, { childList: true });
	});
}

function observeDescription() {
	showEstimates();

	requireElement(".faction-war .members-list").then((membersList) => {
		new MutationObserver((mutations) => {
			let shouldEstimate = false;

			for (const mutation of mutations) {
				for (const node of mutation.removedNodes) {
					if (!isElement(node) || !node.classList?.contains("tt-estimated")) continue;

					node.classList.remove("tt-estimated");
					(mutation.nextSibling as Element)?.remove();
				}

				for (const node of mutation.addedNodes) {
					if (!isElement(node) || (!node.classList?.contains("your") && !node.classList?.contains("enemy"))) continue;

					shouldEstimate = true;
					break;
				}
			}

			if (shouldEstimate) showEstimates();
		}).observe(membersList, { childList: true });
	});
}

function showEstimates() {
	requireElement(".faction-war .members-list").then(() => {
		statsEstimate.clearQueue();
		statsEstimate.showEstimates(".faction-war .members-list > li.enemy, .faction-war .members-list > li.your", (row) => {
			const anchorMatch = row.querySelector<HTMLAnchorElement>(".user.name, [class*='honorWrap___']").href.match(/.*XID=(?<id>\d+)/);

			return {
				id: parseInt(anchorMatch.groups.id),
				level: parseInt(row.querySelector(".level").textContent.trim()),
			};
		});
	});
}

function removeEstimates() {
	observer?.disconnect();
	observer = undefined;

	statsEstimate.clearQueue();
	findAllElements(".tt-stats-estimate").forEach((estimate) => estimate.remove());
}

export default class StatsEstimateFactionWarsFeature extends Feature {
	constructor() {
		super("Stats Estimate Faction Wars", "factions");
	}

	precondition() {
		return getPageStatus().access;
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}

	isEnabled() {
		return settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.wars;
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
		return ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.wars"];
	}
}
