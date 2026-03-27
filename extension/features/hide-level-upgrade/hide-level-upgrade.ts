import "./hide-level-upgrade.css";
import { ExecutionTiming, Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";

function applyStyle() {
	document.documentElement.style.setProperty("--torntools-hide-upgrade-button", settings.pages.global.hideLevelUpgrade ? "none" : "block");
}

export default class HideLevelUpgradeFeature extends Feature {
	constructor() {
		super("Hide Level Upgrade", "global", ExecutionTiming.IMMEDIATELY);
	}

	isEnabled() {
		return settings.pages.global.hideLevelUpgrade;
	}

	execute() {
		applyStyle();
	}

	cleanup() {
		document.documentElement.style.setProperty("--torntools-hide-upgrade-button", "block");
	}

	storageKeys() {
		return ["settings.pages.global.hideLevelUpgrade"];
	}
}
