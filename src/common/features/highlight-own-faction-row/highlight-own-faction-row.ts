import { getFactionSubpage, isInternalFaction } from "@common/pages/factions-page";
import { api, settings, storageListeners } from "@common/utils/data/database";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements } from "@common/utils/functions/find-elements";
import { requireElement } from "@common/utils/functions/requires";
import { Feature } from "@features/feature";
import styles from "./highlight-own-faction-row.module.css";

const MEMBER_ROW = ".faction-info-wrap .members-list .table-body > .table-row";

function updateHighlight() {
	const owner = api.torn.owner;
	const enabled = settings.pages.faction.highlightOwnRow;
	const profileLink = `a[href*="profiles.php?" i]:is([href$="?XID=${owner}" i], [href$="&XID=${owner}" i], [href*="?XID=${owner}&" i], [href*="&XID=${owner}&" i])`;

	for (const row of findAllElements(MEMBER_ROW)) {
		row.classList.toggle(styles.ownRow, enabled && !!owner && !!row.querySelector(profileLink));
	}
}

async function highlightWhenLoaded() {
	if (getFactionSubpage() !== "info" || !settings.pages.faction.highlightOwnRow) return;

	await requireElement(MEMBER_ROW);
	updateHighlight();
}

export default class HighlightOwnFactionRowFeature extends Feature {
	constructor() {
		super("Highlight Own Faction Row", "faction");
	}

	override precondition() {
		return isInternalFaction;
	}

	override isEnabled() {
		return settings.pages.faction.highlightOwnRow;
	}

	override initialise() {
		addCustomListener(EVENT_CHANNELS.FACTION_INFO, highlightWhenLoaded);
		addCustomListener(EVENT_CHANNELS.FACTION_NATIVE_FILTER, updateHighlight);
		addCustomListener(EVENT_CHANNELS.FACTION_NATIVE_SORT, updateHighlight);
		storageListeners.settings.push((oldSettings) => {
			if (oldSettings?.pages.faction.highlightOwnRow && !settings.pages.faction.highlightOwnRow) updateHighlight();
		});
		storageListeners.api.push(updateHighlight);
	}

	override execute() {
		return highlightWhenLoaded();
	}

	override reload() {
		return highlightWhenLoaded();
	}

	override storageKeys() {
		return ["settings.pages.faction.highlightOwnRow"];
	}
}
