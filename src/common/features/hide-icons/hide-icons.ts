import "./hide-icons.css";
import { settings } from "@common/utils/data/database";
import { findAllElements } from "@common/utils/functions/dom";
import { requireSidebar } from "@common/utils/functions/requires";
import { ALL_ICONS } from "@common/utils/functions/torn";
import { ExecutionTiming, Feature } from "@features/feature";

let observer: MutationObserver;

async function initialiseHideIcons() {
	await requireSidebar();

	const selector = "#sidebarroot ul:is([class*='status-icons_'], [class*='statusIcons_'])";
	if (!document.querySelector(selector)) return;

	observer = new MutationObserver((_mutations, observer) => {
		observer.disconnect();
		moveIcons();
		observer.observe(document.querySelector(selector), { childList: true, attributes: true });
	});
	observer.observe(document.querySelector(selector), { childList: true, attributes: true });
}

function applyStyle() {
	for (const { icon } of ALL_ICONS) {
		document.documentElement.style.setProperty(`--torntools-hide-icons-${icon}`, settings.hideIcons.includes(icon) ? "none" : "initial");
	}
	moveIcons();
}

function moveIcons() {
	for (const icon of findAllElements("#sidebarroot ul:is([class*='status-icons_'], [class*='statusIcons_']) > li[class]")) {
		if (!settings.hideIcons.includes(icon.getAttribute("class").split("_")[0])) continue;

		icon.parentElement.appendChild(icon);
	}
}

export default class HideIconsFeature extends Feature {
	constructor() {
		super("Hide Icons", "sidebar", ExecutionTiming.IMMEDIATELY);
	}

	isEnabled() {
		return settings.hideIcons.length > 0;
	}

	async initialise() {
		await initialiseHideIcons();
	}

	execute() {
		applyStyle();
	}

	cleanup() {
		if (observer) {
			observer.disconnect();
		}
		// Reset styles
		for (const { icon } of ALL_ICONS) {
			document.documentElement.style.setProperty(`--torntools-hide-icons-${icon}`, "initial");
		}
	}

	storageKeys() {
		return ["settings.hideIcons"];
	}

	async requirements() {
		await requireSidebar();
		return true;
	}

	requiresScreenInformation(): boolean {
		return false;
	}
}
