import "./hide-leave-buttons.css";
import { ExecutionTiming, Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";

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
}
