import { isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { factiondata, settings } from "@common/utils/data/database";
import { hasAPIData, hasOC1Data } from "@common/utils/functions/api";
import { elementBuilder, findAllElements } from "@common/utils/functions/dom";
import { dropDecimals } from "@common/utils/functions/formatting";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@common/utils/functions/listeners";
import { getPageStatus } from "@common/utils/functions/torn";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import { Feature } from "@features/feature";

function initialiseListeners() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES].push(() => {
		if (!FEATURE_MANAGER.isEnabled(OCLastActionFeature)) return;

		showLastAction();
	});
}

function startFeature() {
	if (!document.querySelector(".faction-crimes-wrap")) return;

	showLastAction();
}

function showLastAction() {
	if (factiondata.access !== "full_access") return;

	const nowDate = Date.now();

	for (const row of findAllElements(".organize-wrap .crimes-list .details-list > li:not(:first-child) > ul")) {
		const id = new URL(row.querySelector<HTMLAnchorElement>(".member a").href).searchParams.get("XID");

		const lastAction = factiondata.basic.members[id].last_action;
		const hours = dropDecimals((nowDate - lastAction.timestamp * 1000) / TO_MILLIS.HOURS);

		row.insertAdjacentElement(
			"afterend",
			elementBuilder({
				type: "div",
				class: "tt-oc-last-action",
				text: `Last action: ${lastAction.relative}`,
				attributes: { hours: hours },
			}),
		);
	}
}

function removeLastAction() {
	for (const lastAction of findAllElements(".tt-oc-last-action")) lastAction.remove();
}

export default class OCLastActionFeature extends Feature {
	constructor() {
		super("OC Last Action", "faction");
	}

	precondition() {
		return getPageStatus().access && isInternalFaction;
	}

	isEnabled() {
		return settings.pages.faction.ocLastAction;
	}

	initialise() {
		initialiseListeners();
	}

	execute() {
		startFeature();
	}

	cleanup() {
		removeLastAction();
	}

	storageKeys() {
		return ["settings.pages.faction.ocLastAction"];
	}

	async requirements() {
		if (!hasAPIData() || !factiondata || !("members" in factiondata)) return "No API access.";
		else if (!hasOC1Data()) return "No OC 1 data.";

		return true;
	}
}
