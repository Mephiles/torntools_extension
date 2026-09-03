import "./missing-sets.css";
import { FEATURE_MANAGER, ITEM_RESOLVER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { elementBuilder, mobile } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { formatNumber } from "@common/utils/functions/formatting";
import { getPageStatus, SETS } from "@common/utils/functions/torn";
import type { SetItem } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

function initialiseFlowers() {
	addCustomListener(EVENT_CHANNELS.ITEM_SWITCH_TAB, async ({ tab }) => {
		if (!FEATURE_MANAGER.isEnabled(MissingFlowersFeature) || tab !== "Flower") {
			removeFlowers();
			return;
		}

		await showFlowers();
	});
	addCustomListener(EVENT_CHANNELS.FEATURE_ENABLED, ({ name }) => {
		if (!FEATURE_MANAGER.isEnabled(MissingFlowersFeature)) return;

		if (name === "Item Values") showMarketValues();
		else if (name === "Market Icons") showMarketIcons();
	});
}

function initialisePlushies() {
	addCustomListener(EVENT_CHANNELS.ITEM_SWITCH_TAB, async ({ tab }) => {
		if (!FEATURE_MANAGER.isEnabled(MissingPlushiesFeature) || tab !== "Plushie") {
			removePlushies();
			return;
		}

		await showPlushies();
	});
	addCustomListener(EVENT_CHANNELS.FEATURE_ENABLED, ({ name }) => {
		if (!FEATURE_MANAGER.isEnabled(MissingPlushiesFeature)) return;

		if (name === "Item Values") showMarketValues();
		else if (name === "Market Icons") showMarketIcons();
	});
}

async function showFlowers() {
	await show("needed-flowers", "#flowers-items", SETS.FLOWERS);
}

function removeFlowers() {
	findElement("#needed-flowers", true)?.remove();
}

async function showPlushies() {
	await show("needed-plushies", "#plushies-items", SETS.PLUSHIES);
}

function removePlushies() {
	findElement("#needed-plushies", true)?.remove();
}

async function show(id: string, selector: string, items: SetItem[]) {
	if (findElement(`#${id}`, true)) findElement(`#${id}`).remove();

	const currentItemsElements = findAllElements(`#category-wrap > ${selector}[aria-expanded='true'] > li[data-item]`);
	if (!currentItemsElements.length || currentItemsElements.length === items.length) return;

	const currentItems = currentItemsElements.map((x) => parseInt(x.dataset.item!));
	const needed = items.filter((x) => !currentItems.some((y) => x.id === y)).sort((a, b) => a.name.localeCompare(b.name));
	if (needed.length <= 0) return;

	const wrapper = elementBuilder({ type: "div", id: id });
	let isFirst = true;
	for (const item of needed) {
		const isLast = needed.indexOf(item) === needed.length - 1;

		const missingItem = elementBuilder({
			type: "div",
			class: "needed-item",
			children: [
				elementBuilder({
					type: "img",
					attributes: { src: `https://www.torn.com/images/items/${item.id}/large.png`, alt: item.name },
				}),
				elementBuilder({ type: "span", text: item.name }),
			],
			dataset: { id: item.id, name: item.name, category: item.category },
		});

		wrapper.appendChild(missingItem);

		addItemValue(missingItem);
		await addMarketIcon(missingItem, isFirst, isLast);

		isFirst = false;
	}
	findElement(".main-items-cont-wrap").insertAdjacentElement("afterend", wrapper);
}

function addItemValue(missingItem: HTMLElement) {
	if (!settings.pages.items.values) return;
	if (!hasAPIData()) return;

	const fullItem = ITEM_RESOLVER.getFullItem(parseInt(missingItem.dataset.id!));
	if (!fullItem) return;

	findElement(":scope > span", missingItem).insertAdjacentElement(
		"afterend",
		elementBuilder({
			type: "span",
			class: "tt-item-price",
			text: formatNumber(fullItem.value.market_price, { currency: true }),
		}),
	);
}

function showMarketValues() {
	for (const missingItem of findAllElements(".needed-item")) {
		addItemValue(missingItem);
	}
}

async function addMarketIcon(missingItem: HTMLElement, first: boolean, last: boolean) {
	if (!settings.pages.items.marketLinks) return;
	if (mobile) return;
	if (findElement(".market-link", missingItem, true)) return;

	let parent = findElement(".outside-actions", missingItem, true);
	if (!parent) {
		parent = elementBuilder({ type: "div", class: `outside-actions ${first ? "first-action" : ""} ${last ? "last-action" : ""}` });

		missingItem.appendChild(parent);
	}

	const id = parseInt(missingItem.dataset.id!);
	const { name, category } = missingItem.dataset;

	parent.appendChild(
		elementBuilder({
			type: "div",
			class: "market-link",
			children: [
				elementBuilder({
					type: "a",
					href: `https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=${id}&itemName=${name}&itemType=${category}`,
					children: [elementBuilder({ type: "i", class: "cql-item-market", attributes: { title: "Open Item Market" } })],
				}),
			],
		}),
	);
}

function showMarketIcons() {
	const items = findAllElements(".needed-item");
	const isFirst = true;
	for (const missingItem of items) {
		const isLast = items.indexOf(missingItem) === items.length - 1;

		void addMarketIcon(missingItem, isFirst, isLast);
	}
}

export class MissingFlowersFeature extends Feature {
	constructor() {
		super("Missing Flowers", "items");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.items.missingFlowers;
	}

	override async initialise() {
		initialiseFlowers();
	}

	override async execute() {
		await showFlowers();
	}

	override storageKeys() {
		return ["settings.pages.items.missingFlowers"];
	}

	override async requirements() {
		if (!hasAPIData() || !settings.apiUsage.user.inventory) return "No API access!";
		return true;
	}
}

export class MissingPlushiesFeature extends Feature {
	constructor() {
		super("Missing Plushies", "items");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.items.missingPlushies;
	}

	override async initialise() {
		initialisePlushies();
	}

	override async execute() {
		await showPlushies();
	}

	override storageKeys() {
		return ["settings.pages.items.missingPlushies"];
	}

	override requirements() {
		if (!hasAPIData() || !settings.apiUsage.user.inventory) return "No API access!";
		return true;
	}
}
