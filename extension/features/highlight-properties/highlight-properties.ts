import "./highlight-properties.css";
import { Feature } from "@/features/feature-manager";
import { getPageStatus, isAbroad, isFlying } from "@/utils/common/functions/torn";
import { settings, userdata } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { requireSidebar } from "@/utils/common/functions/requires";
import { findAllElements } from "@/utils/common/functions/dom";

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
