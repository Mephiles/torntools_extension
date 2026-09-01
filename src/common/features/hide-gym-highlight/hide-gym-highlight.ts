import "./hide-gym-highlight.css";
import { settings } from "@common/utils/data/database";
import { isPageWithSidebar } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

function hideGymHighlight() {
	document.documentElement.classList.add("tt-hide-gym-highlight");
}

export default class HideGymHighlightFeature extends Feature {
	constructor() {
		super("Hide Gym Highlight", "sidebar");
	}

	override precondition() {
		return isPageWithSidebar();
	}

	override isEnabled() {
		return settings.pages.sidebar.hideGymHighlight;
	}

	override execute() {
		hideGymHighlight();
	}

	override storageKeys() {
		return ["settings.pages.sidebar.hideGymHighlight"];
	}
}
