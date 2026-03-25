import "./collapsible-areas.css";
import { Feature } from "@features/feature-manager";
import { filters, settings } from "@/utils/common/data/database";
import { checkDevice, elementBuilder, findElementWithText } from "@/utils/common/functions/dom";
import { requireSidebar } from "@/utils/common/functions/requires";
import { ttStorage } from "@/utils/common/data/storage";
import "@vendor/phosphor-icons";

let observer: MutationObserver | undefined;

async function addCollapseIcon() {
	const title = findElementWithText("h2", "Areas");
	if (!title || title.classList.contains("tt-title-torn")) return;

	title.parentElement.classList.add("tt-areas-header");
	title.classList.add("tt-title-torn");
	if (filters.containers.collapseAreas) title.parentElement.classList.add("collapsed");
	title.addEventListener("click", clickListener);

	const icon = elementBuilder({ type: "i", class: "icon ph-fill ph-caret-down" });
	title.appendChild(icon);

	observer = new MutationObserver(() => {
		if (!title.classList.contains("tt-title-torn")) title.classList.add("tt-title-torn");
	});
	observer.observe(title, { attributes: true, attributeFilter: ["class"] });
}

async function removeCollapseIcon() {
	if (observer) observer.disconnect();

	const title = findElementWithText("h2", "Areas") as HTMLElement;
	if (!title) return;

	const header = title.parentElement as HTMLElement;
	header.classList.remove("tt-title-torn", "collapsed");
	title.removeEventListener("click", clickListener);

	if (title.querySelector(".icon")) title.querySelector(".icon").remove();
}

async function clickListener() {
	const header = (findElementWithText("h2", "Areas") as HTMLElement).parentElement as HTMLElement;
	const collapsed = header.classList.toggle("collapsed");

	await ttStorage.change({ filters: { containers: { collapseAreas: collapsed } } });
}

export default class CollapsibleAreasFeature extends Feature {
	constructor() {
		super("Collapse Areas", "sidebar");
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
