import "./settings-link.css";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { checkDevice, elementBuilder } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findElement } from "@common/utils/functions/find-elements";
import { requireSidebar } from "@common/utils/functions/requires";
import { isPageWithSidebar } from "@common/utils/functions/torn";
import { PHBoldArrowBendUpLeft } from "@common/utils/icons/phosphor-icons";
import { torntools } from "@common/utils/icons/torntools";
import { Feature } from "@features/feature";

function initialiseLink() {
	addCustomListener(EVENT_CHANNELS.STATE_CHANGED, () => {
		if (!FEATURE_MANAGER.isEnabled(SettingsLinkFeature)) return;

		const setting = findElement(".tt-settings", true);
		if (!setting) return;

		new MutationObserver((_mutations, observer) => {
			observer.disconnect();
			setting.parentElement.appendChild(setting);
		}).observe(setting.parentElement, { childList: true });
	});
}

async function addLink() {
	await requireSidebar();

	findElement(".areasWrapper [class*='toggle-content__'], #sidebar [class*='areas___']").appendChild(
		elementBuilder({
			type: "div",
			class: ["tt-settings", "pill"],
			children: [torntools(), elementBuilder({ type: "span", text: "TornTools Settings" })],
			attributes: { icon: "" },
			events: {
				click: generateFrame,
			},
		}),
	);
}

function generateFrame() {
	if (findElement("#tt-settings-iframe", true)) return;

	const theme =
		settings.themes.pages === "default"
			? window.matchMedia
				? window.matchMedia("(prefers-color-scheme: dark)").matches
					? "dark"
					: "light"
				: "light"
			: settings.themes.pages;

	const ttSettingsIframe = elementBuilder({
		type: "iframe",
		id: "tt-settings-iframe",
		attributes: { src: browser.runtime.getURL("/options.html") },
	});

	const returnToTorn = elementBuilder({
		type: "div",
		class: "tt-back",
		children: [PHBoldArrowBendUpLeft(), elementBuilder({ type: "span", id: "back", text: "Back to TORN" })],
		dataset: { internalTheme: theme },
	});

	document.body.append(returnToTorn, ttSettingsIframe);
	document.body.classList.add("tt-iframe-open");

	returnToTorn.addEventListener("click", () => {
		returnToTorn.remove();
		ttSettingsIframe.remove();
		document.body.classList.remove("tt-iframe-open");
	});
}

export default class SettingsLinkFeature extends Feature {
	constructor() {
		super("Settings Link", "sidebar");
	}

	override precondition() {
		return isPageWithSidebar();
	}

	override async requirements() {
		if (!(await checkDevice()).hasSidebar) return "Not supported on mobiles or tablets!";

		return true;
	}

	override isEnabled() {
		return settings.pages.sidebar.settingsLink;
	}

	override initialise() {
		initialiseLink();
	}

	override async execute() {
		await addLink();
	}

	override storageKeys() {
		return ["settings.pages.sidebar.settingsLink"];
	}
}
