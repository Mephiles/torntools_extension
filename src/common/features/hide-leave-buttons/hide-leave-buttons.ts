import "./hide-leave-buttons.css";
import { settings } from "@common/utils/data/database";
import { ExecutionTiming, Feature } from "@features/feature";

function applyStyle() {
	document.documentElement.style.setProperty("--torntools-hide-leave-button", settings.pages.global.hideQuitButtons ? "none" : "flex");
}

export default class HideLeaveButtonsFeature extends Feature {
	constructor() {
		super("Hide Leave Buttons", "global", ExecutionTiming.IMMEDIATELY);
	}

	override isEnabled() {
		return settings.pages.global.hideQuitButtons;
	}

	override execute() {
		applyStyle();
	}

	override storageKeys() {
		return ["settings.pages.global.hideQuitButtons"];
	}

	override requiresScreenInformation(): boolean {
		return false;
	}
}
