import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { isInternalFaction } from "@/pages/factions-page";
import { settings } from "@/utils/common/data/database";
import { findAllElements } from "@/utils/common/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { getPageStatus } from "@/utils/common/functions/torn";

function initialiseListeners() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(OpenOCFeature)) return;

		await openCrimes();
	});
}

async function startFeature() {
	if (!document.querySelector(".faction-crimes-wrap")) return;

	await openCrimes();
}

async function openCrimes() {
	for (const crime of findAllElements(".organize-wrap .crimes-list > li")) {
		const status = crime.querySelector(".status .bold");
		if (!status || status.textContent.trim() !== "Ready") continue;

		const allReady = findAllElements(".details-list > li:not(:first-child) .stat", crime).every((row) => row.textContent === "Okay");
		if (allReady) crime.classList.add("active");
	}
}

export default class OpenOCFeature extends Feature {
	constructor() {
		super("Open OC", "faction");
	}

	precondition() {
		return getPageStatus().access && isInternalFaction;
	}

	isEnabled() {
		return settings.pages.faction.openOc;
	}

	initialise() {
		initialiseListeners();
	}

	async execute() {
		await startFeature();
	}

	storageKeys() {
		return ["settings.pages.faction.openOc"];
	}
}
