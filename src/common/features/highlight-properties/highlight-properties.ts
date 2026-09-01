import "./highlight-properties.css";
import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { requireSidebar } from "@common/utils/functions/requires";
import { getPageStatus, isAbroad, isFlying } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

async function addHighlight() {
	await requireSidebar();

	if (Math.abs(userdata.networth.money.unpaid_fees) >= settings.pages.sidebar.upkeepPropHighlight) {
		const navProperties = document.querySelector("#nav-properties");

		if (!navProperties) return;

		navProperties.classList.add("tt-upkeep");
	}
}

export default class HighlightPropertiesFeature extends Feature {
	constructor() {
		super("Highlight Properties", "sidebar");
	}

	override precondition() {
		return getPageStatus().access && !isFlying() && !isAbroad();
	}

	override isEnabled() {
		return !!settings.pages.sidebar.upkeepPropHighlight;
	}

	override async execute() {
		await addHighlight();
	}

	override storageKeys() {
		return ["settings.pages.sidebar.upkeepPropHighlight"];
	}

	override async requirements() {
		if (!hasAPIData() || !settings.apiUsage.user.networth) return "No API access.";

		return true;
	}
}
