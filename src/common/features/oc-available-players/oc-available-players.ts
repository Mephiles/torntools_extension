import { isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { findAllElements } from "@common/utils/functions/dom";
import { applyPlural } from "@common/utils/functions/formatting";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@common/utils/functions/listeners";
import { createMessageBox, getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

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
