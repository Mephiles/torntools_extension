import { ttStorage } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import { checkDevice, findElementWithText, isElement } from "@common/utils/functions/dom";
import { requireSidebar } from "@common/utils/functions/requires";
import { isFlyoutSidebar, isPageWithSidebar } from "@common/utils/functions/torn";
import { PHFillCaretDown } from "@common/utils/icons/phosphor-icons";
import { Feature } from "@features/feature";
import styles from "./collapsible-areas.module.css";

let listener: (() => void) | undefined;

async function addCollapseIcon() {
	const title = findElementWithText("h2", "Areas");
	if (!isElement(title) || title.classList.contains("tt-collapsible-processed")) return;

	const header = title.parentElement;

	title.classList.add("tt-collapsible-processed");

	const icon = PHFillCaretDown({ class: styles.collapsibleIcon });
	title.classList.add(styles.iconContainer);
	title.appendChild(icon);

	if (isFlyoutSidebar()) {
		const areaWrapper = header.parentElement;

		header.classList.add(styles.clickableArea);
		areaWrapper.classList.add(styles.flyoutSupport);
		if (filters.containers.collapseAreas) areaWrapper.classList.add(styles.collapsed);

		listener = () => clickListener(areaWrapper);
		header.addEventListener("click", listener);
	} else {
		header.classList.add(styles.clickableArea, styles.legacySupport);
		if (filters.containers.collapseAreas) header.classList.add(styles.collapsed);

		listener = () => clickListener(header);
		header.addEventListener("click", listener);
	}
}

async function removeCollapseIcon() {
	document.querySelector(".tt-collapsible-processed")?.classList.remove("tt-collapsible-processed");
	document.querySelector(`.${styles.collapsed}`)?.classList.remove(styles.collapsed);
	document.querySelector(`.${styles.collapsibleIcon}`)?.remove();
}

async function clickListener(parent: HTMLElement) {
	const collapsed = parent.classList.toggle(styles.collapsed);

	await ttStorage.change({ filters: { containers: { collapseAreas: collapsed } } });
}

export default class CollapsibleAreasFeature extends Feature {
	constructor() {
		super("Collapse Areas", "sidebar");
	}

	precondition() {
		return isPageWithSidebar();
	}

	async requirements() {
		const { hasSidebar } = await checkDevice();
		if (!hasSidebar) return "Not supported on mobiles or tablets!";

		await requireSidebar();
		return true;
	}

	isEnabled() {
		return settings.pages.sidebar.collapseAreas;
	}

	async execute() {
		await addCollapseIcon();
	}

	async cleanup() {
		await removeCollapseIcon();
	}

	storageKeys() {
		return ["settings.pages.sidebar.collapseAreas"];
	}
}
