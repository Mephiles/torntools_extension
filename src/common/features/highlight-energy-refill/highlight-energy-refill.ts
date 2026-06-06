import "./highlight-energy-refill.css";
import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { requireElement } from "@common/utils/functions/requires";
import { isPageWithSidebar } from "@common/utils/functions/torn";
import { ExecutionTiming, Feature } from "@features/feature";

function applyStyle() {
	if (!userdata.refills.energy && settings.pages.sidebar.highlightEnergy) document.documentElement.classList.add("tt-highlight-energy-refill");
	else document.documentElement.classList.remove("tt-highlight-energy-refill");
}

export default class HighlightEnergyRefillFeature extends Feature {
	constructor() {
		super("Highlight Energy Refill", "sidebar", ExecutionTiming.IMMEDIATELY);
	}

	precondition() {
		return isPageWithSidebar();
	}

	async requirements() {
		if (!hasAPIData() || !settings.apiUsage.user.refills) return "No API access.";

		return true;
	}

	isEnabled() {
		return settings.pages.sidebar.highlightEnergy;
	}

	async execute() {
		await requireElement("body");
		applyStyle();
	}

	cleanup() {
		document.documentElement.classList.remove("tt-highlight-energy-refill");
	}

	storageKeys() {
		return ["settings.pages.sidebar.highlightEnergy", "userdata.refills.energy"];
	}

	requiresScreenInformation(): boolean {
		return false;
	}
}
