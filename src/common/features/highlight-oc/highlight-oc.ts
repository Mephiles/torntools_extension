import "./highlight-oc.css";
import { isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findElement } from "@common/utils/functions/find-elements";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.FACTION_CRIMES, () => {
		if (!FEATURE_MANAGER.isEnabled(HighlightOCFeature)) return;

		highlightCrime1();
	});
	addCustomListener(EVENT_CHANNELS.FACTION_CRIMES2, () => {
		if (!FEATURE_MANAGER.isEnabled(HighlightOCFeature)) return;

		highlightCrime2();
	});
	addCustomListener(EVENT_CHANNELS.FACTION_CRIMES2_REFRESH, () => {
		if (!FEATURE_MANAGER.isEnabled(HighlightOCFeature)) return;

		highlightCrime2();
	});
}

function startFeature() {
	if (!findElement(".faction-crimes-wrap", true)) return;

	if (userdata.organizedCrime) highlightCrime2();
	else highlightCrime1();
}

function highlightCrime1() {
	const member = findElement(`.crimes-list > li.item-wrap .team > a[href="/profiles.php?XID=${userdata.profile.id}"]`, true);
	if (!member) return;

	member.closest(".item-wrap")!.classList.add("tt-oc-highlight");
}

function highlightCrime2() {
	const member = findElement(`[class*='slotMenuItem___'][href="/profiles.php?XID=${userdata.profile.id}"]`, true);
	if (!member) return;

	member.closest("[class*='contentLayer___']")!.classList.add("tt-oc-highlight");
}

export default class HighlightOCFeature extends Feature {
	constructor() {
		super("Highlight OC", "faction");
	}

	override precondition() {
		return getPageStatus().access && isInternalFaction;
	}

	override isEnabled() {
		return settings.pages.faction.highlightOwn;
	}

	override initialise() {
		initialiseListeners();
	}

	override execute() {
		startFeature();
	}

	override storageKeys() {
		return ["settings.pages.faction.highlightOwn"];
	}

	override async requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}
}
