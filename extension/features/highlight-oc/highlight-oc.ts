import "./highlight-oc.css";
import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { getPageStatus } from "@/utils/common/functions/torn";
import { settings, userdata } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { findAllElements, getSearchParameters } from "@/utils/common/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { isInternalFaction } from "@/pages/factions-page";

function initialiseListeners() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES].push(() => {
		if (!FEATURE_MANAGER.isEnabled(HighlightOCFeature)) return;

		highlightCrime1();
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES2].push(() => {
		if (!FEATURE_MANAGER.isEnabled(HighlightOCFeature)) return;

		highlightCrime2();
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES2_REFRESH].push(() => {
		if (!FEATURE_MANAGER.isEnabled(HighlightOCFeature)) return;

		highlightCrime2();
	});
}

function startFeature() {
	if (!document.querySelector(".faction-crimes-wrap")) return;

	if (userdata.organizedCrime) highlightCrime2();
	else highlightCrime1();
}

function highlightCrime1() {
	const member = document.querySelector(`.crimes-list > li.item-wrap .team > a[href="/profiles.php?XID=${userdata.profile.id}"]`);
	if (!member) return;

	member.closest(".item-wrap").classList.add("tt-oc-highlight");
}

function highlightCrime2() {
	const member = document.querySelector(`[class*='slotMenuItem___'][href="/profiles.php?XID=${userdata.profile.id}"]`);
	if (!member) return;

	member.closest("[class*='contentLayer___']").classList.add("tt-oc-highlight");
}

function removeHighlight() {
	for (const highlight of findAllElements(".tt-oc-highlight")) highlight.classList.remove("tt-oc-highlight");
}

export default class HighlightOCFeature extends Feature {
	constructor() {
		super("Highlight OC", "faction");
	}

	precondition() {
		return getPageStatus().access && isInternalFaction;
	}

	isEnabled() {
		return settings.pages.faction.highlightOwn;
	}

	initialise() {
		initialiseListeners();
	}

	execute() {
		startFeature();
	}

	cleanup() {
		removeHighlight();
	}

	storageKeys() {
		return ["settings.pages.faction.highlightOwn"];
	}

	async requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}
}
