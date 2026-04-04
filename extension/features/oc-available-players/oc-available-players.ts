import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { createMessageBox, getPageStatus } from "@/utils/common/functions/torn";
import { findAllElements } from "@/utils/common/functions/dom";
import { applyPlural } from "@/utils/common/functions/formatting";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { isInternalFaction } from "@/pages/factions-page";

function initialiseListeners() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES].push(() => {
		if (!FEATURE_MANAGER.isEnabled(OCAvailablePlayersFeature)) return;

		showAvailable();
	});
}

function startFeature() {
	if (!document.querySelector(".faction-crimes-wrap")) return;

	showAvailable();
}

function showAvailable() {
	if (document.querySelector("div.plans-list.p10")) {
		displayAvailable(0).then(() => {});
	} else {
		const list = document.querySelector("ul.plans-list");
		if (!list) {
			displayAvailable(-1).then(() => {});
			return;
		}
		const members = findAllElements(".item", list).length;

		displayAvailable(members).then(() => {});
	}

	async function displayAvailable(amount: number) {
		if (document.querySelector("[class*='manualSpawnerContainer___']")) return;

		const crimes = document.querySelector("#faction-crimes");

		let message: string;
		if (amount === -1) {
			message = "You don't have OC permissions.";
		} else {
			message = `${amount} member${applyPlural(amount)} available for OCs.`;
		}

		crimes.insertBefore(createMessageBox(message, { class: "tt-available-players" }), crimes.firstElementChild);
	}
}

function removeAvailable() {
	for (const available of findAllElements(".tt-available-players")) available.remove();
}

export default class OCAvailablePlayersFeature extends Feature {
	constructor() {
		super("OC Available Players", "faction");
	}

	precondition() {
		return getPageStatus().access && isInternalFaction;
	}

	isEnabled() {
		return settings.pages.faction.availablePlayers;
	}

	initialise() {
		initialiseListeners();
	}

	execute() {
		startFeature();
	}

	cleanup() {
		removeAvailable();
	}

	storageKeys() {
		return ["settings.pages.faction.availablePlayers"];
	}
}
