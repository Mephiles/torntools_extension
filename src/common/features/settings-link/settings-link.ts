import "./settings-link.css";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { checkDevice, elementBuilder, findAllElements } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { requireSidebar } from "@common/utils/functions/requires";
import { isPageWithSidebar } from "@common/utils/functions/torn";
import { PHBoldArrowBendUpLeft } from "@common/utils/icons/phosphor-icons";
import { torntools } from "@common/utils/icons/torntools";
import { Feature } from "@features/feature";

function initialiseLink() {
	addCustomListener(EVENT_CHANNELS.STATE_CHANGED, () => {
		if (!FEATURE_MANAGER.isEnabled(SettingsLinkFeature)) return;

		const setting = document.querySelector(".tt-settings");
		if (!setting) return;

		new MutationObserver((_mutations, observer) => {
			observer.disconnect();
			setting.parentElement.appendChild(setting);
		}).observe(setting.parentElement, { childList: true });
	});
}

async function addLink() {
	await requireSidebar();

	document.querySelector(".areasWrapper [class*='toggle-content__'], #sidebar [class*='areas___']").appendChild(
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
	if (document.getElementById("tt-settings-iframe")) return;

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

function removeLink() {
	findAllElements(".tt-back, .tt-settings, #tt-settings-iframe").forEach((x) => x.remove());

	const tornContent = document.querySelector<HTMLElement>(".content-wrapper[role*='main']");
	if (tornContent.style.display === "none") tornContent.style.display = "block";

	document.body.classList.remove("tt-iframe-open");
}

export default class SettingsLinkFeature extends Feature {
	constructor() {
		super("Settings Link", "sidebar");
	}

	precondition() {
		return isPageWithSidebar();
	}

	async requirements() {
		if (!(await checkDevice()).hasSidebar) return "Not supported on mobiles or tablets!";

		return true;
	}

	isEnabled() {
		return settings.pages.sidebar.settingsLink;
	}

	initialise() {
		initialiseLink();
	}

	async execute() {
		await addLink();
	}

	cleanup() {
		removeLink();
	}

	storageKeys() {
		return ["settings.pages.sidebar.settingsLink"];
	}
}
