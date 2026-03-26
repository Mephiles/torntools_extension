import { ExecutionTiming, Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import "./align-left.css";

export default class AlignLeftFeature extends Feature {
	constructor() {
		super("Align Left", "global", ExecutionTiming.IMMEDIATELY);
	}

	isEnabled() {
		return settings.pages.global.alignLeft;
	}

	execute() {
		if (document.title !== "Torn - Just a moment...") {
			document.documentElement.classList.add("tt-align-left");
		}
	}

	cleanup() {
		document.documentElement.classList.remove("tt-align-left");
	}

	storageKeys() {
		return ["settings.pages.global.alignLeft"];
	}
}
