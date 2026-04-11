import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { isInternalFaction } from "@/pages/factions-page";
import { settings } from "@/utils/common/data/database";
import { formatNumber } from "@/utils/common/functions/formatting";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus } from "@/utils/common/functions/torn";

function addListener() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_UPGRADE_INFO].push(async () => {
		if (FEATURE_MANAGER.isEnabled(UpgradeRequiredRespectFeature)) await showRequiredRespect(true);
	});
}

async function showRequiredRespect(force: boolean) {
	if (!force) return;
	await requireElement("#faction-upgrades #stu-confirmation div[role] > :nth-child(3)");

	const availableRespect = parseInt(
		document
			.querySelector("#faction-upgrades .skill-tree .residue-respect")
			.textContent.replace(/[\n, ]/g, "")
			.trim(),
	);
	const requiredNode = document.querySelector("#faction-upgrades #stu-confirmation div[role] .required .text");
	if (!requiredNode || requiredNode.textContent.includes("Challenge:")) return;

	let diff: number;
	if (requiredNode.parentElement.classList.contains("completed")) {
		diff = 0;
	} else {
		const upgradeRespect = parseInt(requiredNode.textContent.replace(/.*Requires: |.*Assigned: | respect.*|,/g, ""));
		diff = upgradeRespect - availableRespect;
		if (diff < 0) diff = 0;
	}
	requiredNode.parentElement.classList.add("tt-modified");
	requiredNode.textContent += ` (${formatNumber(diff)} needed to go)`;
}

function removeRequiredRespect() {
	const requiredNode = document.querySelector("#faction-upgrades #stu-confirmation div[role] > .tt-modified > .text");
	if (requiredNode) {
		requiredNode.textContent = requiredNode.textContent.replace(/ \(.*\)/, "");
		requiredNode.parentElement.classList.remove("tt-modified");
	}
}

export default class UpgradeRequiredRespectFeature extends Feature {
	constructor() {
		super("Upgrade Required Respect", "faction");
	}

	precondition() {
		return getPageStatus().access && isInternalFaction;
	}

	isEnabled() {
		return settings.pages.faction.upgradeRequiredRespect;
	}

	storageKeys(): string[] {
		return ["settings.pages.faction.upgradeRequiredRespect"];
	}

	initialise() {
		addListener();
	}

	async execute(liveReload?: boolean) {
		await showRequiredRespect(liveReload);
	}

	cleanup() {
		removeRequiredRespect();
	}

	shouldLiveReload() {
		return true;
	}
}
