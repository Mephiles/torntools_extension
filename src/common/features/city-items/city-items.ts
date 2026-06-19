import "./city-items.css";
import { type DecodedCityItem, type InternalCityItem, isMapData } from "@common/pages/city-page";
import { FEATURE_MANAGER, ITEM_RESOLVER, SCRIPT_INJECTOR } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { displayAlert } from "@common/utils/functions/alerts";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { createContainer, findContainer, removeContainer } from "@common/utils/functions/containers";
import { elementBuilder, findAllElements } from "@common/utils/functions/dom";
import { formatNumber } from "@common/utils/functions/formatting";
import { addXHRListener } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import type { FullItem } from "@common/utils/torn-api/items.types";
import { ExecutionTiming, Feature } from "@features/feature";
import { CITY_ITEMS_MAP_EVENTS, type CityItemsMapEntry } from "./city-items-map";

const ENCODING_NUMERIC_SYSTEM = 36;

type CityItemEntry = CityItemsMapEntry;

interface CityItem {
	item: number;
	count: number;
	name: string;
	entries: CityItemEntry[];
}

let contentElement: HTMLElement | null = null;
let currentItems: CityItem[] = [];
const collectingEntries = new Set<string>();

function initialise() {
	SCRIPT_INJECTOR.injectCityItemsMap?.();

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
	if (userItems?.length) {
		const items = resolveUserItems(userItems);
		showCityItemsContainer(items).catch(console.error);
		return;
	}

	SCRIPT_INJECTOR.injectCityItemsMap?.();
	window.setTimeout(() => dispatchMapEvent(CITY_ITEMS_MAP_EVENTS.REQUEST_MODEL_ITEMS), 100);
}

function handleModelItems(event: Event) {
	const detail = parseEventDetail<{ items?: unknown }>(event);
	if (!FEATURE_MANAGER.isEnabled(CityItemsFeature) || findContainer("City Items") || !detail) return;

	const userItems = detail.items;
	if (!Array.isArray(userItems)) return;

	const internalItems = userItems.filter(isInternalCityItem);
	if (!internalItems.length) return;

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
		typeof value.coordinates[0] === "number" &&
		typeof value.coordinates[1] === "number" &&
		typeof value.item_id === "number" &&
		typeof value.row_id === "number" &&
		typeof value.timestamp === "number" &&
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

		const entry = getCityItemEntry(item, id);
		const name = item.title || ITEM_RESOLVER.loadItem(id)?.name || `Item ${id}`;

		if (settings.pages.city.combineDuplicates) {
			const duplicate = items.find((item) => item.item === id);

			if (duplicate) {
				duplicate.count++;
				duplicate.entries.push(entry);
			} else items.push({ item: id, count: 1, name, entries: [entry] });
		} else items.push({ item: id, count: 1, name, entries: [entry] });
	});

	return items;
}

function getCityItemId(item: DecodedCityItem | InternalCityItem): number {
	if ("coordinates" in item) return item.item_id;

	return parseInt(item.d, ENCODING_NUMERIC_SYSTEM);
}

function getCityItemEntry(item: DecodedCityItem | InternalCityItem, itemId: number): CityItemEntry {
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
	syncMapEntries(currentItems);
}

function populateContainer(content: HTMLElement, items: CityItem[]) {
	if (ITEM_RESOLVER.hasFullItems()) showValue(content, items);
	else content.querySelector(".tt-city-total")?.remove();
	showItemList(content, items);
	showSearchBox(content, items);
}

function showValue(content: HTMLElement, items: CityItem[]) {
	content.querySelector(".tt-city-total")?.remove();

	const totalValue = items
		.map(({ item, count }): (FullItem & { count: number }) | null => {
			const fullItem = ITEM_RESOLVER.getFullItem(item);
			return fullItem ? { ...fullItem, count } : null;
		})
		.filter((item): item is FullItem & { count: number } => !!item)
		.map(({ value: { market_price: value }, count }) => value * count)
		.filter((value) => !!value)
		.reduce((a, b) => a + b, 0);
	const itemCount = items.map(({ count }) => count).reduce((a, b) => a + b, 0);

	content.appendChild(
		elementBuilder({
			type: "div",
			class: "tt-city-total",
			children: [
				elementBuilder({ type: "span", class: "tt-city-total-text", text: `Item Value (${itemCount}): ` }),
				elementBuilder({ type: "span", class: "tt-city-total-value", text: formatNumber(totalValue, { currency: true }) }),
			],
		}),
	);
}

function showItemList(content: HTMLElement, items: CityItem[]) {
	content.querySelector(".tt-city-items")?.remove();

	const listElement = elementBuilder({ type: "div", class: "tt-city-items hide-collapse" });

	const type = "text";
	switch (type) {
		case "text":
			generateText();
			break;
	}

	content.appendChild(listElement);

	function generateText() {
		let element: HTMLElement;
		if (items.length > 0) {
			const totalCount = items.map(({ count }) => count).reduce((a, b) => a + b, 0);
			element = elementBuilder({
				type: "p",
				children: [
					"There",
					totalCount === 1 ? " is " : " are ",
					elementBuilder({ type: "strong", text: totalCount }),
					totalCount === 1 ? " item " : " items ",
					"in the city: ",
				],
			});

			const _items = [...items];
			if (items.length === 1) {
				element.appendChild(createItemElement(_items[0]));
			} else {
				const last = _items.splice(-1)[0];

				for (const item of _items) {
					element.appendChild(createItemElement(item));
					element.appendChild(document.createTextNode(", "));
				}
				element.lastChild.remove();

				element.appendChild(document.createTextNode(" and "));
				element.appendChild(createItemElement(last));
			}

			element.appendChild(document.createTextNode("."));
		} else {
			element = elementBuilder({ type: "p", text: "There are no items in the city." });
		}
		listElement.appendChild(element);

		function createItemElement({ item, name, count, entries }: CityItem) {
			let text: string;
			if (count > 1) {
				text = `${count}x ${name}`;
			} else text = name;

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
	}
}

function showSearchBox(content: HTMLElement, items: CityItem[]) {
	content.querySelector(".tt-city-search")?.remove();

	const searchBox = elementBuilder({
		type: "label",
		class: "tt-city-search",
		text: "Search:",
		children: [
			elementBuilder({
				type: "input",
				attributes: { type: "text" },
				events: {
					input: (event) => {
						if (!(event.currentTarget instanceof HTMLInputElement)) return;

						const query = event.currentTarget.value.toLowerCase();
						clearSearchHighlights();
						if (!query.length) return;

						const matchedItemIds = items.filter((item) => item.name.toLowerCase().includes(query)).map((item) => item.item);
						for (const itemId of matchedItemIds) highlightItem(itemId, true, "search-hover");
					},
				},
			}),
		],
	});

	content.appendChild(searchBox);
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
			nextItems.push({ ...item, count: item.count - 1, entries: item.entries.filter((_, index) => index !== entryIndex) });
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
	for (const item of findAllElements<HTMLElement>(`.city-item[data-id="${itemId}"]`)) {
		item.classList.toggle(className, state);
	}
}

function clearForcedHighlights() {
	for (const item of findAllElements(".city-item.force-hover, .city-item.search-hover")) item.classList.remove("force-hover", "search-hover");
}

function clearSearchHighlights() {
	for (const item of findAllElements(".city-item.search-hover")) item.classList.remove("search-hover");
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
