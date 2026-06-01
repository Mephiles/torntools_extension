import { Feature } from "@features/feature";
import "./highlight-properties.css";

import { settings, userdata } from "@utils/data/database";
import { hasAPIData } from "@utils/functions/api";
import { findAllElements } from "@utils/functions/dom";
import { requireSidebar } from "@utils/functions/requires";
import { getPageStatus, isAbroad, isFlying } from "@utils/functions/torn";

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
