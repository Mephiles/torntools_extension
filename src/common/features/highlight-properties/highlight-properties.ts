import "./highlight-properties.css";
import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { findAllElements } from "@common/utils/functions/dom";
import { requireSidebar } from "@common/utils/functions/requires";
import { getPageStatus, isAbroad, isFlying } from "@common/utils/functions/torn";
import { Feature } from "@extension/context/feature-manager";

async function addHighlight() {
	await requireSidebar();

	if (Math.abs(userdata.networth.unpaidfees) >= settings.pages.sidebar.upkeepPropHighlight) {
		const navProperties = document.querySelector("#nav-properties");

		if (!navProperties) return;

		navProperties.classList.add("tt-upkeep");
	}
}

function removeHighlight() {
	findAllElements(".tt-upkeep").forEach((x) => x.classList.remove("tt-upkeep"));
}

export default class HighlightPropertiesFeature extends Feature {
	constructor() {
		super("Highlight Properties", "sidebar");
	}

	precondition() {
		return getPageStatus().access && !isFlying() && !isAbroad();
	}

	isEnabled() {
		return !!settings.pages.sidebar.upkeepPropHighlight;
	}

	async execute() {
		await addHighlight();
	}

	cleanup() {
		removeHighlight();
	}

	storageKeys() {
		return ["settings.pages.sidebar.upkeepPropHighlight"];
	}

	async requirements() {
		if (!hasAPIData() || !settings.apiUsage.user.networth) return "No API access.";

		return true;
	}
}
