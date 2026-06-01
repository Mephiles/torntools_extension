import { ExecutionTiming, Feature } from "@features/feature";
import "./hide-level-upgrade.css";

import { settings } from "@utils/data/database";
import { findAllElements } from "@utils/functions/dom";
import { requireContent, requireDOMInteractive } from "@utils/functions/requires";

function applyStyle() {
	document.documentElement.style.setProperty("--torntools-hide-upgrade-button", settings.pages.global.hideLevelUpgrade ? "none" : "block");
}

async function hideUpgrade() {
	await requireDOMInteractive();
	await requireContent();

	const infoRow = findAllElements(".info-msg li").find((li) => li.textContent.includes("Congratulations! You have enough experience to go up to level"));
	if (!infoRow) return;

	if (infoRow.parentElement.childElementCount > 1) infoRow.classList.add("tt-level-upgrade");
	else infoRow.closest(".info-msg").classList.add("tt-level-upgrade");
}

function showUpgrade() {
	for (const info of findAllElements(".tt-level-upgrade")) {
		info.classList.remove("tt-level-upgrade");
	}
}

export default class HideLevelUpgradeFeature extends Feature {
	constructor() {
		super("Hide Level Upgrade", "global", ExecutionTiming.IMMEDIATELY);
	}

	isEnabled() {
		return settings.pages.global.hideLevelUpgrade;
	}

	async execute() {
		applyStyle();
		await hideUpgrade();
	}

	cleanup() {
		document.documentElement.style.setProperty("--torntools-hide-upgrade-button", "block");
		showUpgrade();
	}

	storageKeys() {
		return ["settings.pages.global.hideLevelUpgrade"];
	}

	requiresScreenInformation(): boolean {
		return false;
	}
}
