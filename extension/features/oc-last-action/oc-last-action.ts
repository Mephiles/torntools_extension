import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { factiondata, settings } from "@/utils/common/data/database";
import { getPageStatus } from "@/utils/common/functions/torn";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { hasAPIData, hasOC1Data } from "@/utils/common/functions/api";
import { dropDecimals } from "@/utils/common/functions/formatting";
import { TO_MILLIS } from "@/utils/common/functions/utilities";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { isInternalFaction } from "@/pages/factions-page";

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
			})
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
