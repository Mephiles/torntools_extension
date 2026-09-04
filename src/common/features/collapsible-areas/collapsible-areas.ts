import { ttStorage } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import { checkDevice, isElement } from "@common/utils/functions/dom";
import { findElementWithText } from "@common/utils/functions/find-elements";
import { requireSidebar } from "@common/utils/functions/requires";
import { isFlyoutSidebar, isPageWithSidebar } from "@common/utils/functions/torn";
import { PHFillCaretDown } from "@common/utils/icons/phosphor-icons";
import { Feature } from "@features/feature";
import styles from "./collapsible-areas.module.css";

let listener: (() => void) | undefined;

async function addCollapseIcon() {
	const title = findElementWithText("h2", "Areas", true);
	if (!isElement(title) || title.classList.contains("tt-collapsible-processed")) return;

	const header = title.parentElement!;

	title.classList.add("tt-collapsible-processed");

	const icon = PHFillCaretDown({ class: styles.collapsibleIcon });
	title.classList.add(styles.iconContainer);
	title.appendChild(icon);

	if (isFlyoutSidebar()) {
		const areaWrapper = header.parentElement!;

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
async function clickListener(parent: HTMLElement) {
	const collapsed = parent.classList.toggle(styles.collapsed);

	await ttStorage.change({ filters: { containers: { collapseAreas: collapsed } } });
}

export default class CollapsibleAreasFeature extends Feature {
	constructor() {
		super("Collapse Areas", "sidebar");
	}

	override precondition() {
		return isPageWithSidebar();
	}

	override async requirements() {
		const { hasSidebar } = await checkDevice();
		if (!hasSidebar) return "Not supported on mobiles or tablets!";

		await requireSidebar();
		return true;
	}

	override isEnabled() {
		return settings.pages.sidebar.collapseAreas;
	}

	override async execute() {
		await addCollapseIcon();
	}

	override storageKeys() {
		return ["settings.pages.sidebar.collapseAreas"];
	}
}
