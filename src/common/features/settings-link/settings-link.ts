import { settings } from "@common/utils/data/database";
import { checkDevice, elementBuilder } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findElement } from "@common/utils/functions/find-elements";
import { requireSidebar } from "@common/utils/functions/requires";
import { isPageWithSidebar } from "@common/utils/functions/torn";
import { PHBoldArrowBendUpLeft } from "@common/utils/icons/phosphor-icons";
import { torntools } from "@common/utils/icons/torntools";
import { Feature } from "@features/feature";
import styles from "./settings-link.module.css";

function initialiseLink() {
	addCustomListener(EVENT_CHANNELS.STATE_CHANGED, () => {
		const setting = findElement(`.${styles.settings}`, true);
		if (!setting) return;

		new MutationObserver((_mutations, observer) => {
			observer.disconnect();
			setting.parentElement!.appendChild(setting);
		}).observe(setting.parentElement!, { childList: true });
	});
}

async function addLink() {
	await requireSidebar();

	const parent = findElement(".areasWrapper [class*='toggle-content__'], #sidebar [class*='areas___']");
	if (findElement(`.${styles.settings}`, true)) return;

	parent.appendChild(
		elementBuilder({
			type: "div",
			class: [styles.settings, "pill"],
			children: [torntools(), elementBuilder({ type: "span", text: "TornTools Settings" })],
			dataset: { icon: "" },
			events: {
				click: generateFrame,
			},
		}),
	);
}

function generateFrame() {
	if (findElement(`.${styles.settingsFrame}`, true)) return;

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
		class: styles.settingsFrame,
		attributes: { src: browser.runtime.getURL("/options.html") },
	});

	const returnToTorn = elementBuilder({
		type: "div",
		class: styles.backButton,
		children: [PHBoldArrowBendUpLeft(), elementBuilder({ type: "span", id: "back", text: "Back to TORN" })],
		dataset: { internalTheme: theme },
	});

	document.body.append(returnToTorn, ttSettingsIframe);
	document.body.classList.add(styles.ttSettingsOpen);

	returnToTorn.addEventListener("click", () => {
		returnToTorn.remove();
		ttSettingsIframe.remove();
		document.body.classList.remove(styles.ttSettingsOpen);
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
