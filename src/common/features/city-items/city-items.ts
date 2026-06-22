import "./city-items.css";
import { type DecodedCityItem, type InternalCityItem, isMapData } from "@common/pages/city-page";
import { FEATURE_MANAGER, ITEM_RESOLVER, SCRIPT_INJECTOR, ttStorage } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { createCheckbox } from "@common/utils/elements/checkbox/checkbox";
import { createSelect } from "@common/utils/elements/select/select";
import { displayAlert } from "@common/utils/functions/alerts";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { createContainer, findContainer, removeContainer } from "@common/utils/functions/containers";
import { elementBuilder, findAllElements } from "@common/utils/functions/dom";
import { formatDate, formatNumber } from "@common/utils/functions/formatting";
import { addXHRListener } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { MONTHS } from "@common/utils/functions/utilities";
import type { FullItem } from "@common/utils/torn-api/items.types";
import { ExecutionTiming, Feature } from "@features/feature";
import { CITY_ITEMS_MAP_EVENTS, type CityItemsMapEntry } from "./city-items-map";

const ENCODING_NUMERIC_SYSTEM = 36;
const GROUP_PAGE_SIZE = 10;

type CityItemEntry = CityItemsMapEntry & { timestamp: number };

interface CityItem {
	item: number;
	count: number;
	name: string;
	entries: CityItemEntry[];
	timestamp: number;
	band: string;
}

let contentElement: HTMLElement | null = null;
let currentItems: CityItem[] = [];
let periodFilter = "all";
let searchQuery = "";
let visibleGroupCount = GROUP_PAGE_SIZE;
const collectingEntries = new Set<string>();

function initialise() {
	SCRIPT_INJECTOR.injectCityItemsMap();

	addXHRListener(({ detail: { page, xhr, json } }) => {
		if (!FEATURE_MANAGER.isEnabled(CityItemsFeature)) return;

		if (isMapData(page, xhr, json)) {
			const items = resolveUserItems(decodeTerritoryUserItems(json.territoryUserItems));

			showCityItemsContainer(items).catch(console.error);
			return;
		}

		const pickupTd = getPickupTd(page, xhr.requestBody);
		if (pickupTd && isSuccessfulPickupResponse(json, xhr.responseText)) handleCollectedTd(pickupTd);
	});

	document.addEventListener("click", handleMapOverlayClick, true);
	window.addEventListener(CITY_ITEMS_MAP_EVENTS.MODEL_ITEMS, handleModelItems);
}

function triggerFallback() {
	if (findContainer("City Items")) return;

	const userItems = getPageModelItems();
	if (userItems) {
		const items = resolveUserItems(userItems);
		showCityItemsContainer(items).catch(console.error);
		return;
	}

	window.setTimeout(() => dispatchMapEvent(CITY_ITEMS_MAP_EVENTS.REQUEST_MODEL_ITEMS), 100);
}

function handleModelItems(event: Event) {
	const detail = parseEventDetail<{ items?: unknown }>(event);
	if (!FEATURE_MANAGER.isEnabled(CityItemsFeature) || findContainer("City Items") || !detail) return;

	const userItems = detail.items;
	if (!Array.isArray(userItems)) return;

	const internalItems = userItems.filter(isInternalCityItem);
	if (!internalItems) return;

	const items = resolveUserItems(internalItems);
	showCityItemsContainer(items).catch(console.error);
}

function getPageModelItems(): InternalCityItem[] | null {
	const model = SCRIPT_INJECTOR.getWindow().torn?.model;
	if (!model || typeof model.get !== "function") return null;

	try {
		const fullModel = model.get();
		if (Array.isArray(fullModel?.territoryUserItems)) return fullModel.territoryUserItems;
	} catch {}

	try {
		const userItems = model.get("territoryUserItems");
		if (Array.isArray(userItems)) return userItems;
	} catch {}

	return null;
}

function isInternalCityItem(value: unknown): value is InternalCityItem {
	return (
		isRecord(value) &&
		Array.isArray(value.coordinates) &&
		value.coordinates.length >= 2 &&
		Number.isFinite(value.coordinates[0]) &&
		Number.isFinite(value.coordinates[1]) &&
		Number.isFinite(value.item_id) &&
		Number.isFinite(value.row_id) &&
		Number.isFinite(value.timestamp) &&
		typeof value.title === "string"
	);
}

function parseEventDetail<T>(event: Event): T | null {
	if (!isCustomEvent<unknown>(event)) return null;

	if (typeof event.detail === "string") {
		try {
			return JSON.parse(event.detail) as T;
		} catch {
			return null;
		}
	}

	return event.detail as T;
}

function isCustomEvent<T>(event: Event): event is CustomEvent<T> {
	return "detail" in event;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function hasGetMethod(value: unknown): value is { get(param: string): unknown } {
	return isRecord(value) && typeof value.get === "function";
}

function decodeTerritoryUserItems(encodedItems: string): DecodedCityItem[] {
	const binary = atob(encodedItems);
	let decoded = binary;

	try {
		const bytes = new Uint8Array(binary.length);
		for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
		decoded = new TextDecoder("utf-8").decode(bytes);
	} catch {}

	return JSON.parse(decoded);
}

function resolveUserItems(decodedItems: (DecodedCityItem | InternalCityItem)[]): CityItem[] {
	const items: CityItem[] = [];

	decodedItems.forEach((item) => {
		const id = getCityItemId(item);
		if (!Number.isFinite(id)) return;

		const timestamp = getItemTimestamp(item);
		if (!Number.isFinite(timestamp)) return;

		const entry = getCityItemEntry(item, id, timestamp);
		const name = item.title || ITEM_RESOLVER.loadItem(id)?.name || `Item ${id}`;

		if (settings.pages.city.combineDuplicates) {
			const duplicate = items.find((item) => item.item === id);

			if (duplicate) {
				duplicate.count++;
				duplicate.entries.push(entry);
				duplicate.timestamp = Math.max(duplicate.timestamp, timestamp);
			} else {
				items.push({ item: id, count: 1, name, entries: [entry], timestamp, band: "" });
			}
		} else {
			items.push({ item: id, count: 1, name, entries: [entry], timestamp, band: "" });
		}
	});

	for (const item of items) item.band = getBandForTimestamp(item.timestamp);

	return items;
}

function getItemTimestamp(item: DecodedCityItem | InternalCityItem): number {
	if ("coordinates" in item) return item.timestamp;

	return parseInt(item.ts, ENCODING_NUMERIC_SYSTEM);
}

const MILLISECONDS_PER_DAY = 86_400_000;

// Relative time bands, newest first. City item timestamps are useful at UTC-day
// granularity, so the minimum bucket is a single UTC day; wider bands span
// multiple days. Bands are non-overlapping by age; every item lands in exactly one.
const TIME_BANDS = [
	{ key: "today", maxAgeDays: 0, label: "Today" },
	{ key: "week", maxAgeDays: 7, label: "This week" },
	{ key: "month", maxAgeDays: 30, label: "This month" },
	{ key: "year", maxAgeDays: 365, label: "This year" },
	{ key: "older", maxAgeDays: Number.POSITIVE_INFINITY, label: "More than a year ago" },
] as const;

const GROUP_PERIODS = [
	{ key: "day", label: "Days" },
	{ key: "week", label: "Weeks" },
	{ key: "month", label: "Months" },
	{ key: "year", label: "Years" },
] as const;

type GroupPeriod = (typeof GROUP_PERIODS)[number]["key"];

function getUtcDayStart(milliseconds: number): number {
	const date = new Date(milliseconds);
	return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function getUtcWeekStart(milliseconds: number): number {
	const dayStart = getUtcDayStart(milliseconds);
	const day = new Date(dayStart).getUTCDay();
	return dayStart - ((day + 6) % 7) * MILLISECONDS_PER_DAY;
}

function getBandForTimestamp(timestampSeconds: number): string {
	const ageDays = Math.floor((getUtcDayStart(Date.now()) - getUtcDayStart(timestampSeconds * 1000)) / MILLISECONDS_PER_DAY);
	return TIME_BANDS.find((band) => ageDays <= band.maxAgeDays)?.key ?? "older";
}

function getBandOrder(): readonly string[] {
	return TIME_BANDS.map((band) => band.key);
}

function formatBandLabel(bandKey: string): string {
	return TIME_BANDS.find((band) => band.key === bandKey)?.label ?? bandKey;
}

function getGroupPeriod(): GroupPeriod {
	const groupPeriod = settings.pages.city.groupByPeriodUnit;
	return GROUP_PERIODS.some((period) => period.key === groupPeriod) ? (groupPeriod as GroupPeriod) : "day";
}

function getGroupKey(timestampSeconds: number, groupPeriod = getGroupPeriod()): string {
	return getGroupStart(timestampSeconds, groupPeriod).toString();
}

function getGroupStart(timestampSeconds: number, groupPeriod: GroupPeriod): number {
	const milliseconds = timestampSeconds * 1000;
	const date = new Date(milliseconds);

	if (groupPeriod === "day") return getUtcDayStart(milliseconds);
	if (groupPeriod === "week") return getUtcWeekStart(milliseconds);
	if (groupPeriod === "month") return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);

	return Date.UTC(date.getUTCFullYear(), 0, 1);
}

function formatGroupLabel(groupKey: string, groupPeriod = getGroupPeriod()): string {
	const milliseconds = Number(groupKey);
	if (!Number.isFinite(milliseconds)) return groupKey;

	const date = new Date(milliseconds);
	if (groupPeriod === "month") return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
	if (groupPeriod === "year") return String(date.getUTCFullYear());

	const formattedDate = formatDate({ milliseconds }, { showYear: true });
	return groupPeriod === "week" ? `Week of ${formattedDate}` : formattedDate;
}

function getCityItemId(item: DecodedCityItem | InternalCityItem): number {
	if ("coordinates" in item) return item.item_id;

	return parseInt(item.d, ENCODING_NUMERIC_SYSTEM);
}

function getCityItemEntry(item: DecodedCityItem | InternalCityItem, itemId: number, timestamp: number): CityItemEntry {
	let rowId: string, td: string, x: number, y: number;

	if ("coordinates" in item) {
		rowId = item.row_id.toString(ENCODING_NUMERIC_SYSTEM);
		td = btoa([item.coordinates[0], item.coordinates[1], item.row_id, item.timestamp].map((value) => value.toString(ENCODING_NUMERIC_SYSTEM)).join("O"));
		x = item.coordinates[0];
		y = item.coordinates[1];
	} else {
		rowId = item.id;
		td = btoa([item.c.x, item.c.y, item.id, item.ts].join("O"));
		x = parseInt(item.c.x, ENCODING_NUMERIC_SYSTEM);
		y = parseInt(item.c.y, ENCODING_NUMERIC_SYSTEM);
	}

	return {
		entryId: rowId,
		itemId,
		name: item.title,
		td,
		x,
		y,
		timestamp,
	};
}

async function showCityItemsContainer(items: CityItem[]) {
	await requireElement("#map .leaflet-zoom-animated");

	if (!contentElement || !document.contains(contentElement)) {
		const { content } = createContainer("City Items", { class: "mt10", alwaysContent: true, nextElement: document.querySelector("#tab-menu") });
		contentElement = content;
	}

	setCityItems(items);
}

function setCityItems(items: CityItem[]) {
	currentItems = items;

	if (contentElement) populateContainer(contentElement, currentItems);
	syncVisibleMapEntries();
}

function populateContainer(content: HTMLElement, items: CityItem[]) {
	showControls(content, items);
	if (ITEM_RESOLVER.hasFullItems()) showValue(content, items);
	else content.querySelector(".tt-city-total")?.remove();
	showItemList(content, items);
}

function getFilteredItems(items: CityItem[]): CityItem[] {
	const periodItems =
		periodFilter === "all"
			? items
			: items.flatMap((item) => {
					const entries = item.entries.filter((entry) => matchesPeriodFilter(getBandForTimestamp(entry.timestamp)));
					if (!entries.length) return [];

					const timestamp = Math.max(...entries.map((entry) => entry.timestamp));
					return [{ ...item, count: entries.length, entries, timestamp, band: getBandForTimestamp(timestamp) }];
				});

	const query = searchQuery.trim().toLowerCase();
	return query ? periodItems.filter((item) => item.name.toLowerCase().includes(query)) : periodItems;
}

function matchesPeriodFilter(itemBand: string): boolean {
	if (periodFilter === "older") return itemBand === "older";

	const selectedIndex = TIME_BANDS.findIndex((band) => band.key === periodFilter);
	const itemIndex = TIME_BANDS.findIndex((band) => band.key === itemBand);

	return selectedIndex >= 0 && itemIndex >= 0 && itemIndex <= selectedIndex;
}

function calculateItemValue(items: CityItem[]): { value: number; count: number } {
	const value = items
		.map(({ item, count }): (FullItem & { count: number }) | null => {
			const fullItem = ITEM_RESOLVER.getFullItem(item);
			return fullItem ? { ...fullItem, count } : null;
		})
		.filter((item): item is FullItem & { count: number } => !!item)
		.map(({ value: { market_price: value }, count }) => value * count)
		.filter((value) => !!value)
		.reduce((a, b) => a + b, 0);
	const count = items.reduce((total, item) => total + item.count, 0);

	return { value, count };
}

function showValue(content: HTMLElement, items: CityItem[]) {
	content.querySelector(".tt-city-total")?.remove();

	if (!ITEM_RESOLVER.hasFullItems()) return;

	const { value, count } = calculateItemValue(getFilteredItems(items));

	content.appendChild(
		elementBuilder({
			type: "div",
			class: "tt-city-total",
			children: [
				elementBuilder({ type: "span", class: "tt-city-total-text", text: `Item Value (${count}): ` }),
				elementBuilder({ type: "span", class: "tt-city-total-value", text: formatNumber(value, { currency: true }) }),
			],
		}),
	);
}

function refreshList() {
	if (!contentElement) return;
	showValue(contentElement, currentItems);
	showItemList(contentElement, currentItems);
	syncVisibleMapEntries();
}

function resetVisibleGroups() {
	visibleGroupCount = GROUP_PAGE_SIZE;
}

function showControls(content: HTMLElement, items: CityItem[]) {
	content.querySelector(".tt-city-controls")?.remove();

	const groupByCheckbox = createCheckbox();
	const groupBySelect = createSelect(GROUP_PERIODS.map((period) => ({ value: period.key, description: period.label })));
	groupByCheckbox.setChecked(!!settings.pages.city.groupByPeriod);
	groupBySelect.setSelected(getGroupPeriod());
	groupBySelect.element.disabled = !groupByCheckbox.isChecked();
	groupByCheckbox.onChange(() => {
		const checked = groupByCheckbox.isChecked();
		settings.pages.city.groupByPeriod = checked;
		groupBySelect.element.disabled = !checked;
		resetVisibleGroups();
		void ttStorage.change({ settings: { pages: { city: { groupByPeriod: checked } } } });
		refreshList();
	});
	groupBySelect.onChange(() => {
		const groupByPeriodUnit = groupBySelect.getSelected();
		settings.pages.city.groupByPeriodUnit = groupByPeriodUnit;
		resetVisibleGroups();
		void ttStorage.change({ settings: { pages: { city: { groupByPeriodUnit } } } });
		refreshList();
	});

	const bandOrder = getBandOrder();
	const presentBands = bandOrder.filter((band) => items.some((item) => item.entries.some((entry) => getBandForTimestamp(entry.timestamp) === band)));
	const bandOptions = [{ value: "all", description: "All" }, ...presentBands.map((band) => ({ value: band, description: formatBandLabel(band) }))];
	const periodSelect = createSelect(bandOptions);
	if (!periodSelect.setSelected(periodFilter)) {
		periodSelect.setSelected("all");
		periodFilter = "all";
	}
	periodSelect.onChange(() => {
		periodFilter = periodSelect.getSelected();
		resetVisibleGroups();
		refreshList();
	});

	const searchInput = elementBuilder({
		type: "input",
		value: searchQuery,
		attributes: { type: "text" },
		events: {
			input: (event) => {
				if (!(event.currentTarget instanceof HTMLInputElement)) return;

				searchQuery = event.currentTarget.value;
				resetVisibleGroups();
				refreshList();
			},
		},
	});

	content.appendChild(
		elementBuilder({
			type: "div",
			class: "tt-city-controls hide-collapse",
			children: [
				elementBuilder({
					type: "div",
					class: "tt-city-group-filter",
					children: [
						elementBuilder({ type: "span", class: "tt-city-control-label", text: "Group:" }),
						groupByCheckbox.element,
						groupBySelect.element,
					],
				}),
				elementBuilder({
					type: "label",
					class: "tt-city-period-filter",
					children: [elementBuilder({ type: "span", class: "tt-city-control-label", text: "Filter:" }), periodSelect.element],
				}),
				elementBuilder({
					type: "label",
					class: "tt-city-search-filter",
					children: [elementBuilder({ type: "span", class: "tt-city-control-label", text: "Search:" }), searchInput],
				}),
			],
		}),
	);
}

function getGroupedItems(items: CityItem[]): { label: string; items: CityItem[] }[] {
	const groupPeriod = getGroupPeriod();
	const groups = new Map<string, CityItem[]>();

	for (const item of items) {
		for (const entry of item.entries) {
			const key = getGroupKey(entry.timestamp, groupPeriod);
			const groupItems = groups.get(key) ?? [];
			groups.set(key, groupItems);

			const duplicate = settings.pages.city.combineDuplicates ? groupItems.find((groupedItem) => groupedItem.item === item.item) : undefined;
			if (duplicate) {
				duplicate.count++;
				duplicate.entries.push(entry);
				duplicate.timestamp = Math.max(duplicate.timestamp, entry.timestamp);
				duplicate.band = getBandForTimestamp(duplicate.timestamp);
			} else {
				groupItems.push({ ...item, count: 1, entries: [entry], timestamp: entry.timestamp, band: getBandForTimestamp(entry.timestamp) });
			}
		}
	}

	return [...groups.entries()]
		.sort(([a], [b]) => Number(b) - Number(a))
		.map(([key, groupItems]) => ({ label: formatGroupLabel(key, groupPeriod), items: groupItems }));
}

function showItemList(content: HTMLElement, items: CityItem[]) {
	content.querySelector(".tt-city-items")?.remove();

	const listElement = elementBuilder({ type: "div", class: "tt-city-items hide-collapse" });
	const filtered = getFilteredItems(items);

	if (settings.pages.city.groupByPeriod) {
		const groups = getGroupedItems(filtered);
		const visibleGroups = groups.slice(0, visibleGroupCount);
		if (!groups.length) {
			listElement.appendChild(elementBuilder({ type: "p", text: "There are no items in the city." }));
		} else {
			for (const group of visibleGroups) {
				const { value, count } = calculateItemValue(group.items);
				listElement.appendChild(
					elementBuilder({
						type: "div",
						class: "tt-city-period-group",
						children: [
							elementBuilder({
								type: "div",
								class: "tt-city-period-header",
								children: [
									elementBuilder({ type: "span", class: "tt-city-period-name", text: group.label }),
									elementBuilder({ type: "span", class: "tt-city-period-count", text: `(${count})` }),
									elementBuilder({
										type: "span",
										class: "tt-city-period-value",
										text: ITEM_RESOLVER.hasFullItems() ? formatNumber(value, { currency: true }) : "",
									}),
								],
							}),
						],
					}),
				);
				appendItemsParagraph(listElement, group.items, false);
			}
			appendGroupPaginationControls(listElement, groups.length, visibleGroups.length);
		}
	} else appendItemsParagraph(listElement, filtered, true);

	content.appendChild(listElement);
}

function appendGroupPaginationControls(parent: HTMLElement, totalGroups: number, visibleGroups: number) {
	if (totalGroups <= GROUP_PAGE_SIZE) return;

	const hasMore = visibleGroups < totalGroups;
	const controls = elementBuilder({
		type: "div",
		class: "tt-city-group-pagination",
		children: [elementBuilder({ type: "span", text: `Showing ${visibleGroups} of ${totalGroups} groups` })],
	});

	if (hasMore) {
		controls.appendChild(
			elementBuilder({
				type: "button",
				class: "tt-button-link tt-city-group-pagination-button",
				text: "Show more",
				attributes: { type: "button" },
				events: {
					click: () => {
						visibleGroupCount = Math.min(visibleGroupCount + GROUP_PAGE_SIZE, totalGroups);
						refreshList();
					},
				},
			}),
		);
		controls.appendChild(
			elementBuilder({
				type: "button",
				class: "tt-button-link tt-city-group-pagination-button",
				text: "Show all",
				attributes: { type: "button" },
				events: {
					click: () => {
						visibleGroupCount = totalGroups;
						refreshList();
					},
				},
			}),
		);
	}

	if (visibleGroups > GROUP_PAGE_SIZE) {
		controls.appendChild(
			elementBuilder({
				type: "button",
				class: "tt-button-link tt-city-group-pagination-button",
				text: "Show fewer",
				attributes: { type: "button" },
				events: {
					click: () => {
						resetVisibleGroups();
						refreshList();
					},
				},
			}),
		);
	}

	parent.appendChild(controls);
}

function appendItemsParagraph(parent: HTMLElement, items: CityItem[], withPreamble: boolean) {
	const totalCount = items.reduce((total, item) => total + item.count, 0);
	if (!totalCount) {
		if (withPreamble) parent.appendChild(elementBuilder({ type: "p", text: "There are no items in the city." }));
		return;
	}

	const children: (string | HTMLElement)[] = [];
	if (withPreamble) {
		children.push(
			"There",
			totalCount === 1 ? " is " : " are ",
			elementBuilder({ type: "strong", text: String(totalCount) }),
			totalCount === 1 ? " item " : " items ",
			"in the city: ",
		);
	}

	const paragraph = elementBuilder({ type: "p", children });

	if (items.length === 1) {
		paragraph.appendChild(createItemSpan(items[0]));
	} else {
		const list = [...items];
		const last = list.splice(-1)[0];

		for (const item of list) {
			paragraph.appendChild(createItemSpan(item));
			paragraph.appendChild(document.createTextNode(", "));
		}
		if (paragraph.lastChild) paragraph.lastChild.remove();

		paragraph.appendChild(document.createTextNode(" and "));
		paragraph.appendChild(createItemSpan(last));
	}

	paragraph.appendChild(document.createTextNode("."));
	parent.appendChild(paragraph);
}

function createItemSpan({ item, name, count, entries }: CityItem) {
	const text = count > 1 ? `${count}x ${name}` : name;

	return elementBuilder({
		type: "span",
		text,
		class: "list-item",
		dataset: { id: item },
		events: {
			mouseenter() {
				highlightItem(item, true);
			},
			mouseleave() {
				highlightItem(item, false);
			},
			click(event) {
				if (!event.isTrusted) return;

				collectEntry(entries[0], item, name).catch(console.error);
			},
		},
	});
}

async function collectEntry(entry: CityItemEntry, item: number, name: string) {
	if (collectingEntries.has(entry.entryId)) return;

	collectingEntries.add(entry.entryId);
	try {
		await collectItem(entry.td);
		handleCollectedEntry(entry, item, name);
	} finally {
		collectingEntries.delete(entry.entryId);
	}
}

function handleMapOverlayClick(event: MouseEvent) {
	if (!event.isTrusted) return;
	if (!(event.target instanceof Element)) return;

	const overlay = event.target.closest<HTMLElement>(".tt-city-item-overlay.city-item");
	if (!overlay) return;

	const entry = findEntry(overlay.dataset.td, overlay.dataset.entryId, parseNumericDatasetValue(overlay.dataset.itemId));
	if (!entry) return;

	event.preventDefault();
	event.stopPropagation();
	if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();

	const item = findCityItemForEntry(entry);
	collectEntry(entry, entry.itemId, item?.name ?? entry.name).catch(console.error);
}

function handleCollectedTd(td: string) {
	const entry = findEntry(td);
	if (!entry) return;

	const item = entry.itemId;
	const name = findCityItemForEntry(entry)?.name ?? entry.name;
	handleCollectedEntry(entry, item, name);
}

function handleCollectedEntry(entry: CityItemEntry, item: number, name: string) {
	if (!findEntry(entry.td, entry.entryId)) return;

	setCityItems(removeEntryFromItems(entry));
	clearForcedHighlights();

	let text: string;
	if (ITEM_RESOLVER.hasFullItems()) {
		const value = ITEM_RESOLVER.getFullItem(item)?.value.market_price ?? 0;
		text = `Collected ${name} with a value of ${formatNumber(value, { currency: true })}.`;
	} else {
		text = `Collected ${name}.`;
	}

	displayAlert({ title: "Collected Item", text, type: "success" });
}

function removeEntryFromItems(entry: CityItemEntry): CityItem[] {
	const nextItems: CityItem[] = [];

	for (const item of currentItems) {
		const entryIndex = item.entries.findIndex((existing) => existing.td === entry.td || existing.entryId === entry.entryId);
		if (entryIndex === -1) {
			nextItems.push(item);
			continue;
		}

		if (item.entries.length > 1) {
			const entries = item.entries.filter((_, index) => index !== entryIndex);
			const timestamp = Math.max(...entries.map((entry) => entry.timestamp));
			nextItems.push({ ...item, count: item.count - 1, entries, timestamp, band: getBandForTimestamp(timestamp) });
		}
	}

	return nextItems;
}

function findEntry(td?: string, entryId?: string, itemId?: number): CityItemEntry | null {
	for (const item of currentItems) {
		const entry = item.entries.find((entry) => (td && entry.td === td) || (entryId && entry.entryId === entryId) || (itemId && entry.itemId === itemId));
		if (entry) return entry;
	}

	return null;
}

function findCityItemForEntry(entry: CityItemEntry): CityItem | null {
	return currentItems.find((item) => item.entries.some((existing) => existing.td === entry.td || existing.entryId === entry.entryId)) ?? null;
}

async function collectItem(td: string): Promise<void> {
	const body = new URLSearchParams();
	body.set("step", "uif");
	body.set("td", td);

	const result = await fetchData<unknown>("torn_direct", { action: "city.php", method: "POST", body });
	if (!isSuccessfulPickupResponse(result, typeof result === "string" ? result : undefined)) throw new Error("City item pickup failed.");
}

function syncVisibleMapEntries() {
	syncMapEntries(getFilteredItems(currentItems));
}

function syncMapEntries(items: CityItem[]) {
	dispatchMapEvent(CITY_ITEMS_MAP_EVENTS.SET_ITEMS, {
		entries: items.flatMap(({ entries }) => entries.map(({ entryId, itemId, name, td, x, y }) => ({ entryId, itemId, name, td, x, y }))),
	});
}

function dispatchMapEvent(name: (typeof CITY_ITEMS_MAP_EVENTS)[keyof typeof CITY_ITEMS_MAP_EVENTS], detail?: unknown) {
	SCRIPT_INJECTOR.getWindow().dispatchEvent(new CustomEvent(name, { detail: serializeEventDetail(detail) }));
}

function serializeEventDetail(detail: unknown): string | undefined {
	if (detail === undefined) return undefined;

	try {
		return JSON.stringify(detail);
	} catch {
		return undefined;
	}
}

function highlightItem(itemId: number, state: boolean, className = "force-hover") {
	for (const item of findAllElements(`.city-item[data-id="${itemId}"]`)) {
		item.classList.toggle(className, state);
	}
}

function clearForcedHighlights() {
	for (const item of findAllElements(".city-item.force-hover")) item.classList.remove("force-hover");
}

function parseNumericDatasetValue(value: string | undefined): number | undefined {
	if (value === undefined) return undefined;

	const parsed = parseInt(value);
	return Number.isFinite(parsed) ? parsed : undefined;
}

function getPickupTd(page: string, body: unknown): string | null {
	if (page !== "city") return null;
	if (getBodyParam(body, "step") !== "uif") return null;

	return getBodyParam(body, "td");
}

function getBodyParam(body: unknown, param: string): string | null {
	if (!body) return null;

	if (typeof body === "string") return new URLSearchParams(body).get(param);

	if (body instanceof URLSearchParams) return body.get(param);

	if (hasGetMethod(body)) {
		const value = body.get(param);
		return value == null ? null : value.toString();
	}

	if (isRecord(body) && param in body) {
		const value = body[param];
		return value == null ? null : value.toString();
	}

	return null;
}

function isSuccessfulPickupResponse(json: unknown, text?: string): boolean {
	if (isRecord(json)) {
		if ("success" in json) return json.success === true || json.success === "true" || json.success === 1;
		if ("error" in json && json.error) return false;
	}

	if (typeof text === "string") {
		if (!text.trim()) return true;

		try {
			return isSuccessfulPickupResponse(JSON.parse(text));
		} catch {
			return false;
		}
	}

	return false;
}

function removeHighlight() {
	removeContainer("City Items");
	contentElement = null;
	currentItems = [];
	periodFilter = "all";
	searchQuery = "";
	resetVisibleGroups();
	collectingEntries.clear();
	clearForcedHighlights();
	dispatchMapEvent(CITY_ITEMS_MAP_EVENTS.CLEAR);
	document.removeEventListener("click", handleMapOverlayClick, true);
}

export default class CityItemsFeature extends Feature {
	constructor() {
		super("City Items", "city", ExecutionTiming.IMMEDIATELY);
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.city.items;
	}

	initialise() {
		initialise();
	}

	execute() {
		setTimeout(triggerFallback, 500);
	}

	cleanup() {
		removeHighlight();
	}

	requiresScreenInformation() {
		return false;
	}

	storageKeys() {
		return ["settings.pages.city.items"];
	}
}
