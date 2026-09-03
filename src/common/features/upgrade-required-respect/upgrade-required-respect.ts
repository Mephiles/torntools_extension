import { isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findElement } from "@common/utils/functions/find-elements";
import { formatNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

function addListener() {
	addCustomListener(EVENT_CHANNELS.FACTION_UPGRADE_INFO, async () => {
		if (!FEATURE_MANAGER.isEnabled(UpgradeRequiredRespectFeature)) return;

		await showRequiredRespect();
	});
}

async function showRequiredRespect() {
	await requireElement("#faction-upgrades #stu-confirmation div[role] > :nth-child(3)");

	const availableRespect = parseInt(
		findElement("#faction-upgrades .skill-tree .residue-respect")
			.textContent.replaceAll(/[\n, ]/g, "")
			.trim(),
	);
	const requiredNode = findElement("#faction-upgrades #stu-confirmation div[role] .required .text", true);
	if (!requiredNode || requiredNode.textContent.includes("Challenge:")) return;

	let diff: number;
	if (requiredNode.parentElement!.classList.contains("completed")) {
		diff = 0;
	} else {
		const upgradeRespect = parseInt(requiredNode.textContent.replaceAll(/.*Requires: |.*Assigned: | respect.*|,/g, ""));
		diff = upgradeRespect - availableRespect;
		if (diff < 0) diff = 0;
	}
	requiredNode.parentElement!.classList.add("tt-modified");
	requiredNode.textContent += ` (${formatNumber(diff)} needed to go)`;
}

export default class UpgradeRequiredRespectFeature extends Feature {
	constructor() {
		super("Upgrade Required Respect", "faction");
	}

	override precondition() {
		return getPageStatus().access && isInternalFaction;
	}

	override isEnabled() {
		return settings.pages.faction.upgradeRequiredRespect;
	}

	override storageKeys(): string[] {
		return ["settings.pages.faction.upgradeRequiredRespect"];
	}

	override initialise() {
		addListener();
	}

	override async reload() {
		await showRequiredRespect();
	}
}
