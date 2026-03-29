import "./hide-icons.css";
import { ExecutionTiming, Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { findAllElements } from "@/utils/common/functions/dom";
import { ALL_ICONS } from "@/utils/common/functions/torn";
import { requireSidebar } from "@/utils/common/functions/requires";

let observer: MutationObserver;

async function initialiseHideIcons() {
	await requireSidebar();

	const selector = "#sidebarroot ul[class*='status-icons_']";
	if (document.querySelector(selector)) {
		observer = new MutationObserver((_mutations, observer) => {
			observer.disconnect();
			moveIcons();
			observer.observe(document.querySelector(selector), { childList: true, attributes: true });
		});
		observer.observe(document.querySelector(selector), { childList: true, attributes: true });
	}
}

function applyStyle() {
	for (const { icon } of ALL_ICONS) {
		document.documentElement.style.setProperty(`--torntools-hide-icons-${icon}`, settings.hideIcons.includes(icon) ? "none" : "initial");
	}
	moveIcons();
}

function moveIcons() {
	for (const icon of findAllElements("#sidebarroot ul[class*='status-icons_'] > li")) {
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
}
