import "./highlight-energy-refill.css";
import { ExecutionTiming, Feature } from "@/features/feature-manager";
import { settings, userdata } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { requireElement } from "@/utils/common/functions/requires";

function applyStyle() {
	if (!userdata.refills.energy && settings.pages.sidebar.highlightEnergy) document.documentElement.classList.add("tt-highlight-energy-refill");
	else document.documentElement.classList.remove("tt-highlight-energy-refill");
}

export default class HighlightEnergyRefillFeature extends Feature {
	constructor() {
		super("Highlight Energy Refill", "sidebar", ExecutionTiming.IMMEDIATELY);
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

	async requirements() {
		if (!hasAPIData() || !settings.apiUsage.user.refills) return "No API access.";

		return true;
	}
}
