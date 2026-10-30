import { CRIMES2 } from "@common/pages/crimes2-page";
import { ttStorage } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import { isElement } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { checkboxesSection, createFilter } from "@common/utils/functions/filters";
import type { FilterController } from "@common/utils/functions/filters";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { convertToNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import { BUILD_LABELS, hidesMark, PICKPOCKETING_BUILDS, PICKPOCKETING_TIERS, TIER_LABELS } from "./filter-rules";
import type { PickpocketingSelection } from "./filter-rules";
import styles from "./pickpocketing-filter.module.css";

const ROWS = ".crime-root [class*='virtualList__'] > [class*='virtualItem__']";
const MARK_ROWS = `${ROWS}:not(:first-child)`;
const ROW_MARK_NAME = "[class*='titleAndProps__'] > div";
const ROW_PHYSICAL_PROPS = "[class*='physicalProps__']";

let filter: FilterController | undefined;
let listObserver: MutationObserver | undefined;
let observedRoot: Element | undefined;
let current: PickpocketingFilterState | undefined;
let buildsVisible: boolean | undefined;

type PickpocketingFilterState = { enabled: boolean; tiers: string[]; builds: string[] };

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.CRIMES2_CRIME_LOADED, async ({ crime, crimeRoot }) => {
		if (crime !== CRIMES2.PICKPOCKETING) {
			removeFilter();
			return;
		}

		await addFilterContainer(crimeRoot);
	});

	addCustomListener(EVENT_CHANNELS.CRIMES2_HOME_LOADED, () => removeFilter());
}

async function addFilterContainer(crimeRoot: Element | null) {
	if (!filter) {
		filter = createFilter<PickpocketingFilterState>({
			rowSelector: MARK_ROWS,
			container: {
				title: "Pickpocketing Filter",
				class: ["mb10", "reset-styles"],
				nextElement: crimeRoot ?? (await requireElement(".crime-root")),
				compact: true,
			},
			statisticsLabel: "targets",
			enabled: filters.pickpocketing.enabled,
			sections: [
				checkboxesSection({
					key: "tiers",
					title: "Target Tier",
					items: PICKPOCKETING_TIERS.map((tier) => ({ id: tier, description: TIER_LABELS[tier] })),
					defaults: filters.pickpocketing.tiers,
					test: (row, tiers) => !isHidden(row, { tiers, builds: [] }),
				}),
				checkboxesSection({
					key: "builds",
					title: "Body Type",
					items: PICKPOCKETING_BUILDS.map((build) => ({ id: build, description: BUILD_LABELS[build] })),
					defaults: filters.pickpocketing.builds,
					enabled: () => buildsVisible === true,
					test: (row, builds) => !isHidden(row, { tiers: [], builds }),
				}),
			],
			onStateChange: async (state) => {
				current = state;
				await ttStorage.change({ filters: { pickpocketing: { enabled: state.enabled, tiers: state.tiers, builds: state.builds } } });
			},
			onAfterRun: applyRows,
		});

		current = { enabled: filters.pickpocketing.enabled, tiers: filters.pickpocketing.tiers, builds: filters.pickpocketing.builds };
		document.body.classList.add(styles.body);
	}

	observeList(crimeRoot ?? (await requireElement(".crime-root")));
	await filter.run();
}

function observeList(crimeRoot: Element) {
	if (observedRoot === crimeRoot) return;

	listObserver?.disconnect();
	observedRoot = crimeRoot;

	listObserver = new MutationObserver((mutations) => {
		if (!mutations.some((mutation) => Array.from(mutation.addedNodes).some((node) => isElement(node) && node.matches(ROWS)))) return;

		// Applied synchronously: the controller's own run() awaits a storage write, which paints the unfiltered list first.
		applyRows();
		void filter?.run();
	});
	listObserver.observe(crimeRoot, { childList: true, subtree: true });
}

function applyRows() {
	const selection: PickpocketingSelection =
		current?.enabled === false ? { tiers: [], builds: [] } : { tiers: current?.tiers ?? [], builds: current?.builds ?? [] };
	let offset = rowOffset();

	for (const row of findAllElements(MARK_ROWS)) {
		const hidden = isHidden(row, selection);

		row.classList.toggle("tt-hidden", hidden);
		if (hidden) continue;

		// Torn positions every row with its own translateY, so the visible ones have to be re-stacked to close the gaps.
		row.style.transform = `translateY(${offset}px)`;
		offset += convertToNumber(row.style.height);
	}

	updateBuildsVisible();
}

function isHidden(row: Element, selection: PickpocketingSelection): boolean {
	return hidesMark(findElement(ROW_MARK_NAME, row, true)?.textContent, findElement(ROW_PHYSICAL_PROPS, row, true)?.textContent, selection);
}

function updateBuildsVisible() {
	const visible = findAllElements(MARK_ROWS).some((row) => !!findElement(ROW_PHYSICAL_PROPS, row, true)?.textContent?.trim());
	if (buildsVisible === visible) return;

	buildsVisible = visible;
	filter?.rerenderSections();
}

function rowOffset(): number {
	const spacerHeight = findElement(ROWS, document, true)?.style.height;

	return spacerHeight ? convertToNumber(spacerHeight) : 0;
}

function removeFilter() {
	const wasFiltering = document.body.classList.contains(styles.body);

	filter?.dispose();
	filter = undefined;
	listObserver?.disconnect();
	listObserver = undefined;
	observedRoot = undefined;
	document.body.classList.remove(styles.body);

	if (wasFiltering) {
		current = { enabled: false, tiers: [], builds: [] };
		applyRows();
	}

	current = undefined;
}

export default class PickpocketingFilterFeature extends Feature {
	constructor() {
		super("Pickpocketing Filter", "crimes2");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.crimes2.pickpocketingFilter;
	}

	override initialise() {
		initialiseListeners();
	}

	override storageKeys() {
		return ["settings.pages.crimes2.pickpocketingFilter"];
	}
}
