import "./hide-level-upgrade.css";
import { settings } from "@common/utils/data/database";
import { findAllElements } from "@common/utils/functions/find-elements";
import { requireContent, requireDOMInteractive } from "@common/utils/functions/requires";
import { ExecutionTiming, Feature } from "@features/feature";

function applyStyle() {
	document.documentElement.style.setProperty("--torntools-hide-upgrade-button", settings.pages.global.hideLevelUpgrade ? "none" : "block");
}

async function hideUpgrade() {
	await requireDOMInteractive();
	await requireContent();

	const infoRow = findAllElements(".info-msg li").find((li) => li.textContent.includes("Congratulations! You have enough experience to go up to level"));
	if (!infoRow) return;

	if (infoRow.parentElement!.childElementCount > 1) infoRow.classList.add("tt-level-upgrade");
	else infoRow.closest(".info-msg")!.classList.add("tt-level-upgrade");
}

export default class HideLevelUpgradeFeature extends Feature {
	constructor() {
		super("Hide Level Upgrade", "global", ExecutionTiming.IMMEDIATELY);
	}

	override isEnabled() {
		return settings.pages.global.hideLevelUpgrade;
	}

	override async execute() {
		applyStyle();
		await hideUpgrade();
	}

	override storageKeys() {
		return ["settings.pages.global.hideLevelUpgrade"];
	}

	override requiresScreenInformation(): boolean {
		return false;
	}
}
