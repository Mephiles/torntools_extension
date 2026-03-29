import "./missing-sets.css";
import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { getPageStatus, SetItem, SETS } from "@/utils/common/functions/torn";
import { settings, torndata } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { elementBuilder, findAllElements, mobile } from "@/utils/common/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { formatNumber } from "@/utils/common/functions/formatting";

function initialiseFlowers() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_SWITCH_TAB].push(async ({ tab }) => {
		if (!FEATURE_MANAGER.isEnabled(MissingFlowersFeature) || tab !== "Flower") {
			removeFlowers();
			return;
		}

		await showFlowers();
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.FEATURE_ENABLED].push(({ name }) => {
		if (!FEATURE_MANAGER.isEnabled(MissingFlowersFeature)) return;

		if (name === "Item Values") showMarketValues();
		else if (name === "Market Icons") showMarketIcons();
	});
}

function initialisePlushies() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_SWITCH_TAB].push(async ({ tab }) => {
		if (!FEATURE_MANAGER.isEnabled(MissingPlushiesFeature) || tab !== "Plushie") {
			removePlushies();
			return;
		}

		await showPlushies();
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.FEATURE_ENABLED].push(({ name }) => {
		if (!FEATURE_MANAGER.isEnabled(MissingPlushiesFeature)) return;

		if (name === "Item Values") showMarketValues();
		else if (name === "Market Icons") showMarketIcons();
	});
}

async function showFlowers() {
	await show("needed-flowers", "#flowers-items", SETS.FLOWERS);
}

function removeFlowers() {
	if (document.querySelector("#needed-flowers")) document.querySelector("#needed-flowers").remove();
}

async function showPlushies() {
	await show("needed-plushies", "#plushies-items", SETS.PLUSHIES);
}

function removePlushies() {
	if (document.querySelector("#needed-plushies")) document.querySelector("#needed-plushies").remove();
}

async function show(id: string, selector: string, items: SetItem[]) {
	if (document.querySelector(`#${id}`)) document.querySelector(`#${id}`).remove();

	const currentItemsElements = findAllElements(`#category-wrap > ${selector}[aria-expanded='true'] > li[data-item]`);
	if (!currentItemsElements.length || currentItemsElements.length === items.length) return;

	const currentItems = currentItemsElements.map((x) => parseInt(x.dataset.item));
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
	document.querySelector(".main-items-cont-wrap").insertAdjacentElement("afterend", wrapper);
}

function addItemValue(missingItem: HTMLElement) {
	if (!settings.pages.items.values) return;
	if (!hasAPIData()) return;

	missingItem.querySelector(":scope > span").insertAdjacentElement(
		"afterend",
		elementBuilder({
			type: "span",
			class: "tt-item-price",
			text: `${formatNumber(torndata.itemsMap[parseInt(missingItem.dataset.id)].value.market_price, { currency: true })}`,
		})
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
	if (missingItem.querySelector(".market-link")) return;

	let parent = missingItem.querySelector(".outside-actions");
	if (!parent) {
		parent = elementBuilder({ type: "div", class: `outside-actions ${first ? "first-action" : ""} ${last ? "last-action" : ""}` });

		missingItem.appendChild(parent);
	}

	const id = parseInt(missingItem.dataset.id);
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
		})
	);
}

function showMarketIcons() {
	const items = findAllElements(".needed-item");
	let isFirst = true;
	for (const missingItem of items) {
		const isLast = items.indexOf(missingItem) === items.length - 1;

		void addMarketIcon(missingItem, isFirst, isLast);
	}
}

export class MissingFlowersFeature extends Feature {
	constructor() {
		super("Missing Flowers", "items");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.items.missingFlowers;
	}

	async initialise() {
		initialiseFlowers();
	}

	async execute() {
		await showFlowers();
	}

	cleanup() {
		removeFlowers();
	}

	storageKeys() {
		return ["settings.pages.items.missingFlowers"];
	}

	async requirements() {
		if (!hasAPIData() || !settings.apiUsage.user.inventory) return "No API access!";
		return true;
	}
}

export class MissingPlushiesFeature extends Feature {
	constructor() {
		super("Missing Plushies", "items");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.items.missingPlushies;
	}

	async initialise() {
		initialisePlushies();
	}

	async execute() {
		await showPlushies();
	}

	cleanup() {
		removePlushies();
	}

	storageKeys() {
		return ["settings.pages.items.missingPlushies"];
	}

	requirements() {
		if (!hasAPIData() || !settings.apiUsage.user.inventory) return "No API access!";
		return true;
	}
}
