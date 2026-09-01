import { settings } from "@common/utils/data/database";
import { ExecutionTiming, Feature } from "@features/feature";
import "./align-left.css";

export default class AlignLeftFeature extends Feature {
	constructor() {
		super("Align Left", "global", ExecutionTiming.IMMEDIATELY);
	}

	override isEnabled() {
		return settings.pages.global.alignLeft;
	}

	override execute() {
		if (document.title !== "Torn - Just a moment...") {
			document.documentElement.classList.add("tt-align-left");
		}
	}

	override storageKeys() {
		return ["settings.pages.global.alignLeft"];
	}

	override requiresScreenInformation(): boolean {
		return false;
	}
}
