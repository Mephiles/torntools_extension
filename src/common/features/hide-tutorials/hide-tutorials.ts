import "./hide-tutorials.css";
import { settings } from "@common/utils/data/database";
import { ExecutionTiming, Feature } from "@extension/context/feature-manager";

async function applyStyle() {
	document.documentElement.style.setProperty("--torntools-hide-tutorials", settings.pages.global.hideTutorials ? "none" : "flex");
}

export default class HideTutorialsFeature extends Feature {
	constructor() {
		super("Hide Tutorials", "global", ExecutionTiming.IMMEDIATELY);
	}

	isEnabled() {
		return settings.pages.global.hideTutorials;
	}

	async execute() {
		await applyStyle();
	}

	cleanup() {
		document.documentElement.style.setProperty("--torntools-hide-tutorials", "flex");
	}

	storageKeys() {
		return ["settings.pages.global.hideTutorials"];
	}

	requiresScreenInformation(): boolean {
		return false;
	}
}
