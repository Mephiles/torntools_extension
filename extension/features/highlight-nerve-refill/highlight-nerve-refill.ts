import "./highlight-nerve-refill.css";
import { ExecutionTiming, Feature } from "@/features/feature-manager";
import { settings, userdata } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { requireElement } from "@/utils/common/functions/requires";

function applyStyle() {
	if (!userdata.refills.nerve && settings.pages.sidebar.highlightNerve) document.documentElement.classList.add("tt-highlight-nerve-refill");
	else document.documentElement.classList.remove("tt-highlight-nerve-refill");
}

export default class HighlightNerveRefillFeature extends Feature {
	constructor() {
		super("Highlight Nerve Refill", "sidebar", ExecutionTiming.IMMEDIATELY);
	}

	isEnabled() {
		return settings.pages.sidebar.highlightNerve;
	}

	async execute() {
		await requireElement("body");
		applyStyle();
	}

	cleanup() {
		document.documentElement.classList.remove("tt-highlight-nerve-refill");
	}

	storageKeys() {
		return ["settings.pages.sidebar.highlightNerve", "userdata.refills.nerve"];
	}

	async requirements() {
		if (!hasAPIData() || !settings.apiUsage.user.refills) return "No API access.";

		return true;
	}
}
