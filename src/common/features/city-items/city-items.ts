import "./city-items.css";
import { type DecodedCityItem, isMapData } from "@common/pages/city-page";
import { FEATURE_MANAGER, ITEM_RESOLVER, SCRIPT_INJECTOR } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { displayAlert } from "@common/utils/functions/alerts";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { createContainer, findContainer, removeContainer } from "@common/utils/functions/containers";
import { elementBuilder } from "@common/utils/functions/dom";
import { formatNumber } from "@common/utils/functions/formatting";
import { addXHRListener } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import type { FullItem } from "@common/utils/torn-api/items.types";
import { Feature } from "@features/feature";

interface CityItem {
	item: number;
	count: number;
	name: string;
	entries: { id: string; td: string }[];
}

function initialise() {
	addXHRListener(({ detail: { page, xhr, json } }) => {
		if (!FEATURE_MANAGER.isEnabled(CityItemsFeature)) return;

		if (isMapData(page, xhr, json)) {
			const items = resolveUserItems(JSON.parse(atob(json.territoryUserItems)));

			showCityItemsContainer(items).catch(console.error);
		}
	});
}

function triggerFallback() {
	if (findContainer("City Items")) return;

	const model = SCRIPT_INJECTOR.getWindow().torn?.model?.get?.();
	if (!model) return;

	const userItems = model.territoryUserItems;
	if (!userItems) return;

	const items = resolveUserItems(userItems);

	showCityItemsContainer(items).catch(console.error);
}

function resolveUserItems(decodedItems: DecodedCityItem[]): CityItem[] {
	const items: CityItem[] = [];

	decodedItems.forEach((item) => {
		const id = ITEM_RESOLVER.findItem((x) => x.name === item.title)?.id ?? -1;
		const td = btoa([item.c.x, item.c.y, item.id, item.ts].join("O"));

		if (settings.pages.city.combineDuplicates) {
			const duplicate = items.find((item) => item.item === id);

			if (duplicate) {
				duplicate.count++;
				duplicate.entries.push({ id: item.id, td });
			} else items.push({ item: id, count: 1, name: item.title, entries: [{ id: item.id, td }] });
		} else items.push({ item: id, count: 1, name: item.title, entries: [{ id: item.id, td }] });
	});

	return items;
}

async function showCityItemsContainer(items: CityItem[]) {
	await requireElement("#map .leaflet-zoom-animated");

	const { content } = createContainer("City Items", { class: "mt10", alwaysContent: true, nextElement: document.querySelector("#tab-menu") });

	populateContainer(content, items);
}

function populateContainer(content: HTMLElement, items: CityItem[]) {
	if (ITEM_RESOLVER.hasFullItems()) showValue(content, items);
	showItemList(content, items);
}

function showValue(content: HTMLElement, items: CityItem[]) {
	content.querySelector(".tt-city-total")?.remove();

	const totalValue = items
		.map(({ item, count }): FullItem & { count: number } => ({ ...ITEM_RESOLVER.getFullItem(item), count }))
		.filter((item) => !!item)
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
				events: {
					click() {
						const entry = entries[0];

						collectItem(entry.td).then(() => {
							const newItems = [...items.filter((a) => a.item !== item)];
							if (entries.length > 1) newItems.push({ item, name, count: count - 1, entries: entries.slice(1) });

							populateContainer(content, newItems);

							let text: string;
							if (ITEM_RESOLVER.hasFullItems()) {
								const value = ITEM_RESOLVER.getFullItem(item)?.value.market_price ?? 0;
								text = `Collected ${name} with a value of ${formatNumber(value, { currency: true })}.`;
							} else {
								text = `Collected ${name}.`;
							}

							displayAlert({ title: "Collected Item", text, type: "success" });
						});
					},
				},
			});
		}
	}
}

async function collectItem(td: string): Promise<void> {
	const body = new URLSearchParams();
	body.set("step", "uif");
	body.set("td", td);

	await fetchData("torn_direct", { action: "city.php", method: "POST", body });
}

function removeHighlight() {
	removeContainer("City Items");
}

export default class CityItemsFeature extends Feature {
	constructor() {
		super("City Items", "city");
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

	storageKeys() {
		return ["settings.pages.city.items"];
	}
}
