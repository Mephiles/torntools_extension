import "./hide-tutorials.css";
import { ExecutionTiming, Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";

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
}
