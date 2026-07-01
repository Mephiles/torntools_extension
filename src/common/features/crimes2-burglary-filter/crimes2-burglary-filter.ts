import "./crimes2-burglary-filter.css";
import { CRIMES2 } from "@common/pages/crimes2-page";
import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import { createContainer, findContainer, removeContainer } from "@common/utils/functions/containers";
import { elementBuilder, findAllElements } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { checkboxesSection, createStatistics, textSection } from "@common/utils/functions/filters";
import { convertToNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { DisabledUntilNoticeFeature } from "@features/feature";

let CRIMES2_ROWS_START_Y = 64;
const localFilters: Record<string, any> = {};

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.CRIMES2_CRIME_LOADED, async ({ crime, crimeRoot, url }) => {
		if (crime !== CRIMES2.BURGLARY) {
			removeFilter();
			return;
		}
		if (!FEATURE_MANAGER.isEnabled(Crimes2BurglaryFilterFeature)) return;

		const searchParams = new URL(url).searchParams;
		if (searchParams.get("step") === "attempt") {
			await requireElement(".virtual-item.outcome-expanded button.commit-button");
			const height = document.querySelector<HTMLElement>(".virtual-item:first-child")?.style?.height;
			CRIMES2_ROWS_START_Y = height ? convertToNumber(height) : 64;
		}
		await addFilterContainer(crimeRoot);
	});
	addCustomListener(EVENT_CHANNELS.CRIMES2_HOME_LOADED, () => removeFilter());
}

async function createFilterUI(crimeRoot: Element) {
	document.body.classList.add("torntools-burglary-filter");

	const { content } = createContainer("Burglary Filter", {
		class: "mb10",
		nextElement: crimeRoot,
		filter: true,
		resetStyles: true,
	});

	const statistics = createStatistics("targets");
	content.appendChild(statistics.element);
	localFilters.statistics = { updateStatistics: statistics.updateStatistics };

	const filterContent = elementBuilder({ type: "div", class: "content" });

	const trigger = () => filtering();

	const targetName = textSection({
		key: "targetName",
		title: "Target Name",
		defaultValue: filters.burglary.targetName,
		test: () => true,
	});
	const nameBuilt = targetName.build(trigger);
	filterContent.appendChild(elementBuilder({ type: "div", children: [nameBuilt.element] }));
	localFilters.targetName = { getValue: nameBuilt.getValue };

	const targetType = checkboxesSection({
		key: "targetType",
		title: "Target Type",
		items: [
			{ id: "residential-targets", description: "Residential Targets" },
			{ id: "commercial-targets", description: "Commercial Targets" },
			{ id: "industrial-targets", description: "Industrial Targets" },
		],
		defaults: filters.burglary.targetType,
		test: () => true,
	});
	const typeBuilt = targetType.build(trigger);
	filterContent.appendChild(elementBuilder({ type: "div", children: [typeBuilt.element] }));
	localFilters.targetType = { getSelections: typeBuilt.getValue };

	content.appendChild(filterContent);
}

async function addFilterContainer(crimeRoot: Element | null) {
	if (!window.location.hash.includes("burglary")) return;
	if (!crimeRoot) {
		try {
			crimeRoot = await requireElement(".crime-root.burglary-root");
		} catch {
			return;
		}
	}
	if (!findContainer("Burglary Filter")) await createFilterUI(crimeRoot);
	await filtering();
}

async function filtering() {
	await requireElement(".crime-root.burglary-root [class*='virtualList__'] > [class*='virtualItem__']");

	const height = document.querySelector<HTMLElement>(".virtual-item:first-child")?.style?.height;
	CRIMES2_ROWS_START_Y = height ? convertToNumber(height) : 64;

	const content = findContainer("Burglary Filter").querySelector("main");
	const targetName = localFilters.targetName.getValue() as string;
	const targetType = localFilters.targetType.getSelections() as string[];

	await ttStorage.change({ filters: { burglary: { targetName: targetName.trim(), targetType } } });

	// ponytail: burglary uses translateY-based layout, not tt-hidden — custom loop stays
	let targetRowHeightsSum = CRIMES2_ROWS_START_Y;
	for (const targetEl of findAllElements(".crime-root.burglary-root [class*='virtualList__'] > [class*='virtualItem__']:not(:first-child)")) {
		const rowTargetName = targetEl.querySelector("[class*='crimeOptionSection__']").textContent;
		if (targetName && !rowTargetName.includes(targetName)) {
			hideRow(targetEl);
			continue;
		}
		const targetImageSource = targetEl.querySelector<HTMLImageElement>("[class*='crime-image'] img").currentSrc;
		const matchedImageSource = targetImageSource.match(/residential|commercial|industrial/);
		const rowTargetType = matchedImageSource?.length ? `${matchedImageSource[0]}-targets` : null;
		if (targetType.length && (rowTargetType === null || !targetType.includes(rowTargetType))) {
			hideRow(targetEl);
			continue;
		}
		showRow(targetEl, targetRowHeightsSum);
		targetRowHeightsSum += convertToNumber(targetEl.style.height);
	}

	localFilters.statistics.updateStatistics(
		findAllElements(".crime-root.burglary-root [class*='virtualList__'] > [class*='virtualItem__']:not(:first-child):not(.tt-filter-hidden)").length,
		findAllElements(".crime-root.burglary-root [class*='virtualList__'] > [class*='virtualItem__']:not(:first-child)").length,
		content,
	);
}

function showRow(li: HTMLElement, translateHeight: number) {
	li.classList.remove("tt-filter-hidden");
	li.style.transform = `translateY(${translateHeight}px)`;
}
function hideRow(li: HTMLElement) {
	li.style.transform = "translateY(0)";
	li.classList.add("tt-filter-hidden");
}

function removeFilter() {
	document.body.classList.remove("torntools-burglary-filter");
	removeContainer("Burglary Filter");
	const height = document.querySelector<HTMLElement>(".virtual-item:first-child")?.style?.height;
	CRIMES2_ROWS_START_Y = height ? convertToNumber(height) : 64;
	let targetRowHeightsSum = CRIMES2_ROWS_START_Y;
	findAllElements(".crime-root.burglary-root [class*='virtualList__'] > [class*='virtualItem__']:not(:first-child)").forEach((li) => {
		(li as HTMLElement).classList.remove("tt-filter-hidden");
		(li as HTMLElement).style.transform = `translateY(${targetRowHeightsSum}px)`;
		targetRowHeightsSum += convertToNumber((li as HTMLElement).style.height);
	});
}

export default class Crimes2BurglaryFilterFeature extends DisabledUntilNoticeFeature {
	constructor() {
		super("Burglary Filter", "crimes2");
	}
	precondition() {
		return getPageStatus().access;
	}
	isEnabled() {
		return settings.pages.crimes2.burglaryFilter;
	}
	initialise() {
		initialiseListeners();
	}
	cleanup() {
		removeFilter();
	}
	storageKeys() {
		return ["settings.pages.crimes2.burglaryFilter"];
	}
}
