import { getFactionSubpage, isDestroyed, isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { findAllElements } from "@common/utils/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus, getUsername } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import { StatsEstimate } from "./stats-estimate";

const statsEstimate = new StatsEstimate("Faction Members", true);

function registerListeners() {
	if (isInternalFaction) {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(async () => {
			if (!FEATURE_MANAGER.isEnabled(StatsEstimateFactionMembersFeature) || settings.pages.faction.memberFilter) return;

			await showEstimates();
		});
	}

	CUSTOM_LISTENERS[EVENT_CHANNELS.FILTER_APPLIED].push(async ({ filter }) => {
		if (!FEATURE_MANAGER.isEnabled(StatsEstimateFactionMembersFeature) || filter !== "Faction Member Filter") return;

		await showEstimates();
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_NATIVE_FILTER].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(StatsEstimateFactionMembersFeature)) return;

		removeEstimates();
		await showEstimates();
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_NATIVE_SORT].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(StatsEstimateFactionMembersFeature)) return;

		removeEstimates();
		await showEstimates();
	});
}

async function startFeature(forced: boolean) {
	if (isInternalFaction && getFactionSubpage() !== "info") return;
	if (settings.pages.faction.memberFilter && !forced) return;
	if (!isInternalFaction && (await isDestroyed())) return;

	await showEstimates();
}

async function showEstimates() {
	await requireElement(".faction-info-wrap .table-body");

	statsEstimate.clearQueue();
	statsEstimate.showEstimates(
		".faction-info-wrap .table-body > .table-row",
		(row) => {
			// Don't show this for fallen players.
			if (row.querySelector(".icons li[id*='icon77___']")) return null;

			return {
				id: getUsername(row).id,
				level: parseInt(row.querySelector(".lvl").textContent.trim()),
			};
		},
		{
			hasFilter: true,
			placement: (row) =>
				row.nextElementSibling?.classList.contains("tt-last-action") || row.nextElementSibling?.classList.contains("tt-member-info")
					? (row.nextElementSibling as HTMLElement)
					: row,
		},
	);
}

function removeEstimates() {
	statsEstimate.clearQueue();
	findAllElements(".tt-stats-estimate").forEach((estimate) => estimate.remove());
	findAllElements(".tt-estimated").forEach((row) => row.classList.remove("tt-estimated"));
}

export default class StatsEstimateFactionMembersFeature extends Feature {
	constructor() {
		super("Stats Estimate Faction Members", "factions");
	}

	precondition() {
		return getPageStatus().access;
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}

	isEnabled() {
		return settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.factions;
	}

	initialise() {
		registerListeners();
	}

	async execute() {
		await startFeature(false);
	}

	cleanup() {
		removeEstimates();
	}

	storageKeys(): string[] {
		return ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.factions"];
	}
}
