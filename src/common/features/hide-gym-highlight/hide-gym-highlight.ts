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

	precondition() {
		return isPageWithSidebar();
	}

	isEnabled() {
		return settings.pages.sidebar.hideGymHighlight;
	}

	execute() {
		hideGymHighlight();
	}

	storageKeys() {
		return ["settings.pages.sidebar.hideGymHighlight"];
	}
}
