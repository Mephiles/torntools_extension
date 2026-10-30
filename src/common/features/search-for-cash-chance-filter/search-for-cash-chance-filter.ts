import { CRIMES2 } from "@common/pages/crimes2-page";
import { ttStorage } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import { createTextbox } from "@common/utils/elements/textbox/textbox";
import { createContainer, removeContainer } from "@common/utils/functions/containers";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { logger } from "@common/utils/functions/logger";
import { Feature } from "@features/feature";
import { parseChance, shouldDisable } from "./chance-rules";
import styles from "./search-for-cash-chance-filter.module.css";

const CONTAINER_ID = "tt-search-for-cash-chance-filter";
const CONTAINER_TITLE = "Search for Cash Filter";

const ROWS = ".crime-root [class*='virtualList__'] > [class*='virtualItem__']";
const ROW_CHANCE = "[class*='densityTooltipTrigger']";
const ROW_BUTTON = "button[class*='commitButton']";
const APPLY_DELAY = 300;

// The tooltip has to live on the button's section: the button itself is pointer-events: none, so it never gets hovered.
const TOOLTIP = (minChance: number) => `Disabled by TornTools: below your minimum chance of ${minChance}%.`;

let controls: ReturnType<typeof createTextbox> | undefined;
let observer: MutationObserver | undefined;
let observedRoot: Element | undefined;
let applyTimeout: ReturnType<typeof setTimeout> | undefined;

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.CRIMES2_CRIME_LOADED, ({ crime, crimeRoot }) => {
		if (crime !== CRIMES2.SEARCH_FOR_CASH) {
			removeFilter();
			return;
		}

		addFilter(crimeRoot);
	});

	addCustomListener(EVENT_CHANNELS.CRIMES2_HOME_LOADED, removeFilter);
}

function addFilter(crimeRoot: Element) {
	observeList(crimeRoot);
	ensureContainer(crimeRoot);
	apply();
}

function ensureContainer(crimeRoot: Element) {
	if (controls) return;

	const { options } = createContainer(CONTAINER_TITLE, {
		id: CONTAINER_ID,
		class: ["mb10", "reset-styles"],
		onlyHeader: true,
		nextElement: crimeRoot,
	});

	controls = createTextbox({
		type: "number",
		description: { before: "Min chance", after: "%" },
		attributes: { min: "0", max: "100", step: "1" },
		style: { width: "45px" },
	});
	controls.setValue(filters.searchForCash.minChance ? String(filters.searchForCash.minChance) : "");
	controls.onChange(onThresholdInput);

	options.appendChild(controls.element);
}

function onThresholdInput() {
	clearTimeout(applyTimeout);

	applyTimeout = setTimeout(() => {
		const parsed = parseInt(controls?.getValue() ?? "", 10);
		const minChance = Number.isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));

		apply(minChance);
		ttStorage.change({ filters: { searchForCash: { minChance } } }).catch((error) => logger.debug("Couldn't store the minimum chance.", error));
	}, APPLY_DELAY);
}

function observeList(crimeRoot: Element) {
	if (observedRoot === crimeRoot) return;

	observer?.disconnect();
	observedRoot = crimeRoot;

	// Torn recreates the rows when the list refreshes, so the disabled state has to be reapplied.
	observer = new MutationObserver(() => apply());
	observer.observe(crimeRoot, { childList: true, subtree: true });
}

function apply(minChance = filters.searchForCash.minChance) {
	for (const row of findAllElements(ROWS)) {
		const button = findElement<HTMLButtonElement>(ROW_BUTTON, row, true);
		if (!button) continue;

		const ours = button.dataset.ttChanceDisabled === "true";
		// Places Torn itself blocked (missing item, crime level) aren't ours to style.
		if (!ours && button.getAttribute("aria-disabled") === "true") continue;

		if (!shouldDisable(parseChance(findElement(ROW_CHANCE, row, true)?.getAttribute("aria-label")), minChance)) {
			restoreButton(button, ours);
			continue;
		}

		button.dataset.ttChanceDisabled = "true";
		button.setAttribute("aria-disabled", "true");
		button.parentElement?.classList.add(styles.disabled);
		if (button.parentElement) button.parentElement.title = TOOLTIP(minChance);
	}
}

function restoreButton(button: HTMLButtonElement, ours: boolean) {
	if (!ours) return;

	delete button.dataset.ttChanceDisabled;
	button.setAttribute("aria-disabled", "false");
	button.parentElement?.classList.remove(styles.disabled);
	button.parentElement?.removeAttribute("title");
}

function removeFilter() {
	clearTimeout(applyTimeout);

	apply(0);

	observer?.disconnect();
	observer = undefined;
	observedRoot = undefined;

	controls?.dispose();
	controls = undefined;

	removeContainer(CONTAINER_TITLE, { id: CONTAINER_ID });
}

export default class SearchForCashChanceFilterFeature extends Feature {
	constructor() {
		super("Search for Cash Chance Filter", "crimes2");
	}

	override isEnabled() {
		return settings.pages.crimes2.searchForCashChanceFilter;
	}

	override initialise() {
		initialiseListeners();
	}

	override storageKeys() {
		return ["settings.pages.crimes2.searchForCashChanceFilter"];
	}
}
