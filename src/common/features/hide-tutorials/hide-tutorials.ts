import "./hide-tutorials.css";
import { settings } from "@common/utils/data/database";
import { ExecutionTiming, Feature } from "@features/feature";

async function applyStyle() {
	document.documentElement.style.setProperty("--torntools-hide-tutorials", settings.pages.global.hideTutorials ? "none" : "flex");
}

export default class HideTutorialsFeature extends Feature {
	constructor() {
		super("Hide Tutorials", "global", ExecutionTiming.IMMEDIATELY);
	}

	override isEnabled() {
		return settings.pages.global.hideTutorials;
	}

	override async execute() {
		await applyStyle();
	}

	override storageKeys() {
		return ["settings.pages.global.hideTutorials"];
	}

	override requiresScreenInformation(): boolean {
		return false;
	}
}
