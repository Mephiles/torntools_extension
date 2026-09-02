import { isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { applyPlural } from "@common/utils/functions/formatting";
import { createMessageBox, getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.FACTION_CRIMES, () => {
		if (!FEATURE_MANAGER.isEnabled(OCAvailablePlayersFeature)) return;

		showAvailable();
	});
}

function startFeature() {
	if (!findElement(".faction-crimes-wrap", true)) return;

	showAvailable();
}

function showAvailable() {
	if (findElement("div.plans-list.p10", true)) {
		displayAvailable(0).then(() => {});
	} else {
		const list = findElement("ul.plans-list", true);
		if (!list) {
			displayAvailable(-1).then(() => {});
			return;
		}
		const members = findAllElements(".item", list).length;

		displayAvailable(members).then(() => {});
	}

	async function displayAvailable(amount: number) {
		if (findElement("[class*='buttonsContainer___']", true)) return;

		const crimes = findElement("#faction-crimes");

		let message: string;
		if (amount === -1) {
			message = "You don't have OC permissions.";
		} else {
			message = `${amount} member${applyPlural(amount)} available for OCs.`;
		}

		crimes.insertBefore(createMessageBox(message, { class: "tt-available-players" }), crimes.firstElementChild);
	}
}

export default class OCAvailablePlayersFeature extends Feature {
	constructor() {
		super("OC Available Players", "faction");
	}

	override precondition() {
		return getPageStatus().access && isInternalFaction;
	}

	override isEnabled() {
		return settings.pages.faction.availablePlayers;
	}

	override initialise() {
		initialiseListeners();
	}

	override execute() {
		startFeature();
	}

	override storageKeys() {
		return ["settings.pages.faction.availablePlayers"];
	}
}
