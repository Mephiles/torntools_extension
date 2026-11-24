import { getFactionSubpage, isInternalFaction } from "@common/pages/factions-page";
import { settings, userdata } from "@common/utils/data/database";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findElement } from "@common/utils/functions/find-elements";
import { requireElement } from "@common/utils/functions/requires";
import { Feature } from "@features/feature";
import styles from "./highlight-own-faction-row.module.css";

const MEMBER_ROW = ".faction-info-wrap .members-list .table-body > .table-row";

function updateHighlight() {
	const playerId = userdata?.profile?.id;
	if (!playerId) return;

	findElement(`.${styles.ownRow}`, true)?.classList.remove(styles.ownRow);
	findElement(`${MEMBER_ROW}:has(a[href$="/profiles.php?XID=${playerId}"])`, true)?.classList.add(styles.ownRow);
}

async function highlightWhenLoaded() {
	if (getFactionSubpage() !== "info") return;

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
	}

	override async execute() {
		await highlightWhenLoaded();
	}

	override async reload() {
		await highlightWhenLoaded();
	}

	override storageKeys() {
		return ["settings.pages.faction.highlightOwnRow", "userdata.profile.id"];
	}
}
