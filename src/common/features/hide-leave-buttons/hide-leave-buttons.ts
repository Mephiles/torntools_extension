import { ExecutionTiming, Feature } from "@features/feature";
import "./hide-leave-buttons.css";

import { settings } from "@utils/data/database";

function applyStyle() {
	document.documentElement.style.setProperty("--torntools-hide-leave-button", settings.pages.global.hideQuitButtons ? "none" : "flex");
}

export default class HideLeaveButtonsFeature extends Feature {
	constructor() {
		super("Hide Leave Buttons", "global", ExecutionTiming.IMMEDIATELY);
	}

	isEnabled() {
		return settings.pages.global.hideQuitButtons;
	}

	execute() {
		applyStyle();
	}

	cleanup() {
		document.documentElement.style.setProperty("--torntools-hide-leave-button", "flex");
	}

	storageKeys() {
		return ["settings.pages.global.hideQuitButtons"];
	}

	requiresScreenInformation(): boolean {
		return false;
	}
}
