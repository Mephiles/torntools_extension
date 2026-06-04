import "./hide-gym-highlight.css";
import { settings } from "@common/utils/data/database";
import { hasSidebar, mobile, tablet } from "@common/utils/functions/dom";
import { requireSidebar } from "@common/utils/functions/requires";
import { hasDarkMode, isPageWithSidebar } from "@common/utils/functions/torn";
import { Feature } from "@extension/context/feature-manager";

let hadHighlight = false;

async function hideGymHighlight() {
	await requireSidebar();

	const navGym = document.querySelector("#nav-gym, #nav-jail_gym");
	if (!navGym) return;

	hadHighlight = Array.from(navGym.classList).some((c) => c.startsWith("available___"));
	if (!hadHighlight) return;

	const svg = navGym.querySelector("svg");
	if (hasDarkMode()) {
		if (!hasSidebar) {
			svg.setAttribute("fill", svg.getAttribute("fill").replace("_green", ""));
			svg.setAttribute("filter", svg.getAttribute("filter").replace("_green", ""));
		} else {
			svg.setAttribute("fill", "url(#sidebar_svg_gradient_regular_mobile)");
			svg.setAttribute("filter", "url(#svg_sidebar_mobile)");
		}
	} else {
		if (mobile || tablet) {
			svg.setAttribute("fill", "url(#sidebar_svg_gradient_regular_mobile)");
			svg.setAttribute("filter", "url(#svg_sidebar_mobile)");
		} else {
			svg.setAttribute("fill", "url(#sidebar_svg_gradient_regular_desktop)");
		}
	}

	const availableClass = Array.from(navGym.classList).find((className) => className.startsWith("available___"));
	if (availableClass) navGym.classList.remove(availableClass);
}

function removeHiddenHighlight() {
	if (!hadHighlight) return;

	const navGym = document.querySelector("#nav-gym, #nav-jail_gym");
	if (!navGym) return;

	const svg = navGym.querySelector("svg");

	if (hasDarkMode()) {
		if (mobile || tablet) {
			svg.setAttribute("fill", "url(#sidebar_svg_gradient_regular_green_mobile)");
			svg.setAttribute("filter", "url(#svg_sidebar_green_regular_mobile_green_filter)");
		} else {
			svg.setAttribute("fill", "url(#sidebar_svg_gradient_regular_green_mobile)");
			svg.setAttribute("filter", "url(#svg_sidebar_green_mobile)");
		}
	} else {
		if (mobile || tablet) {
			svg.setAttribute("fill", "url(#sidebar_svg_gradient_regular_green_mobile)");
			svg.setAttribute("filter", "url(#svg_sidebar_green_regular_mobile_green_filter)");
		} else {
			svg.setAttribute("fill", "url(#sidebar_svg_gradient_regular_desktop_green)");
		}
	}

	navGym.querySelector("[class*='area-row___']").classList.add("tt-available");
}

export default class HideGymHighlightFeature extends Feature {
	constructor() {
		super("Hide Gym Highlight", "sidebar");
	}

	precondition() {
		return isPageWithSidebar();
	}

	isEnabled() {
		return settings.pages.sidebar.hideGymHighlight;
	}

	async execute() {
		await hideGymHighlight();
	}

	cleanup() {
		removeHiddenHighlight();
	}

	storageKeys() {
		return ["settings.pages.sidebar.hideGymHighlight"];
	}
}
