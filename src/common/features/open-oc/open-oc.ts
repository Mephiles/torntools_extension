import { isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.FACTION_CRIMES, async () => {
		if (!FEATURE_MANAGER.isEnabled(OpenOCFeature)) return;

		await openCrimes();
	});
}

async function startFeature() {
	if (!findElement(".faction-crimes-wrap", true)) return;

	await openCrimes();
}

async function openCrimes() {
	for (const crime of findAllElements(".organize-wrap .crimes-list > li")) {
		const status = findElement(".status .bold", crime, true);
		if (status?.textContent.trim() !== "Ready") continue;

		const allReady = findAllElements(".details-list > li:not(:first-child) .stat", crime).every((row) => row.textContent === "Okay");
		if (allReady) crime.classList.add("active");
	}
}

export default class OpenOCFeature extends Feature {
	constructor() {
		super("Open OC", "faction");
	}

	override precondition() {
		return getPageStatus().access && isInternalFaction;
	}

	override isEnabled() {
		return settings.pages.faction.openOc;
	}

	override initialise() {
		initialiseListeners();
	}

	override async execute() {
		await startFeature();
	}

	override storageKeys() {
		return ["settings.pages.faction.openOc"];
	}
}
