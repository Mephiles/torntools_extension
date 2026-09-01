import "./highlight-nerve-refill.css";
import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { requireElement } from "@common/utils/functions/requires";
import { isPageWithSidebar } from "@common/utils/functions/torn";
import { ExecutionTiming, Feature } from "@features/feature";

function applyStyle() {
	if (!userdata.refills.nerve && settings.pages.sidebar.highlightNerve) document.documentElement.classList.add("tt-highlight-nerve-refill");
	else document.documentElement.classList.remove("tt-highlight-nerve-refill");
}

export default class HighlightNerveRefillFeature extends Feature {
	constructor() {
		super("Highlight Nerve Refill", "sidebar", ExecutionTiming.IMMEDIATELY);
	}

	override precondition() {
		return isPageWithSidebar();
	}

	override async requirements() {
		if (!hasAPIData() || !settings.apiUsage.user.refills) return "No API access.";

		return true;
	}

	override isEnabled() {
		return settings.pages.sidebar.highlightNerve;
	}

	override async execute() {
		await requireElement("body");
		applyStyle();
	}

	override storageKeys() {
		return ["settings.pages.sidebar.highlightNerve", "userdata.refills.nerve"];
	}

	override requiresScreenInformation(): boolean {
		return false;
	}
}
