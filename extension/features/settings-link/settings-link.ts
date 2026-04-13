import "./settings-link.css";
import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { checkDevice, elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { getPageTheme } from "@/utils/common/functions/pages";
import { requireSidebar } from "@/utils/common/functions/requires";
import { PHBoldArrowBendUpLeft } from "@/utils/common/icons/phosphor-icons";
import { torntools } from "@/utils/common/icons/torntools";

function initialiseLink() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.STATE_CHANGED].push(() => {
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

	document.querySelector(".areasWrapper [class*='toggle-content__']").appendChild(
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

	const ttSettingsIframe = elementBuilder({
		type: "iframe",
		id: "tt-settings-iframe",
		attributes: { src: browser.runtime.getURL("/options.html") },
	});

	const returnToTorn = elementBuilder({
		type: "div",
		class: "tt-back",
		children: [PHBoldArrowBendUpLeft(), elementBuilder({ type: "span", id: "back", text: "Back to TORN" })],
		dataset: { internalTheme: getPageTheme() },
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

	async precondition() {
		return (await checkDevice()).hasSidebar;
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
