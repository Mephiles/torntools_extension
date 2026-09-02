import { getFactionSubpage, isDestroyed, isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus, getUsername } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import { StatsEstimate } from "./stats-estimate";

const statsEstimate = new StatsEstimate("Faction Members", true);

function registerListeners() {
	if (isInternalFaction) {
		addCustomListener(EVENT_CHANNELS.FACTION_INFO, async () => {
			if (!FEATURE_MANAGER.isEnabled(StatsEstimateFactionMembersFeature) || settings.pages.faction.memberFilter) return;

			await showEstimates();
		});
	}

	addCustomListener(EVENT_CHANNELS.FILTER_APPLIED, async ({ filter }) => {
		if (!FEATURE_MANAGER.isEnabled(StatsEstimateFactionMembersFeature) || filter !== "Faction Member Filter") return;

		await showEstimates();
	});
	addCustomListener(EVENT_CHANNELS.FACTION_NATIVE_FILTER, async () => {
		if (!FEATURE_MANAGER.isEnabled(StatsEstimateFactionMembersFeature)) return;

		removeEstimates();
		await showEstimates();
	});
	addCustomListener(EVENT_CHANNELS.FACTION_NATIVE_SORT, async () => {
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
			if (findElement(".icons li[id*='icon77___']", row, true)) return null;

			return {
				id: getUsername(row).id,
				level: parseInt(findElement(".lvl", row).textContent.trim()),
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

	override precondition() {
		return getPageStatus().access;
	}

	override requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}

	override isEnabled() {
		return settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.factions;
	}

	override initialise() {
		registerListeners();
	}

	override async execute() {
		await startFeature(false);
	}

	override storageKeys(): string[] {
		return ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.factions"];
	}
}
