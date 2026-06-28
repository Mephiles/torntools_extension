import "./highlight-cheap-items.css";
import { FEATURE_MANAGER, ITEM_RESOLVER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { findAllElements, getHashParameters } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { convertToNumber } from "@common/utils/functions/formatting";
import { getPageStatus } from "@common/utils/functions/torn";
import { BACKGROUND_SERVICE } from "@extension/services/proxy-services";
import { Feature } from "@features/feature";

interface ItemEntry {
	element: Element;
	price: number;
	id: number;
}

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.ITEMMARKET_CATEGORY_ITEMS, ({ list }) => {
		if (!FEATURE_MANAGER.isEnabled(HighlightCheapItemsFeature)) return;

		highlightItems(findAllElements("[class*='itemList___'] > li:not(.tt-highlight-modified)", list));
	});
	addCustomListener(EVENT_CHANNELS.ITEMMARKET_CATEGORY_ITEMS_UPDATE, ({ item }) => {
		if (!FEATURE_MANAGER.isEnabled(HighlightCheapItemsFeature)) return;

		highlightItems([item]);
	});
	addCustomListener(EVENT_CHANNELS.ITEMMARKET_ITEMS, ({ item, list }) => {
		if (!FEATURE_MANAGER.isEnabled(HighlightCheapItemsFeature)) return;

		highlightSellers(item, list, false);
	});
	addCustomListener(EVENT_CHANNELS.ITEMMARKET_ITEMS_UPDATE, ({ item, list }) => {
		if (!FEATURE_MANAGER.isEnabled(HighlightCheapItemsFeature)) return;

		highlightSellers(item, list, true);
	});
	addCustomListener(EVENT_CHANNELS.WINDOW__FOCUS, () => {
		if (!FEATURE_MANAGER.isEnabled(HighlightCheapItemsFeature)) return;

		removeHighlights();
		highlightEverything();
	});
}

function highlightEverything() {
	const categoryItems = findAllElements("[class*='itemList___'] > li:not(.tt-highlight-modified)")
		.map<ItemEntry | null>((element) => {
			const image = element.querySelector<HTMLImageElement>("img.torn-item");
			if (!image) return null;

			return {
				element,
				id: convertToNumber(image.src),
				price: convertToNumber(element.querySelector("[class*='priceAndTotal'] > span").textContent),
			};
		})
		.filter((item) => item?.element);

	handleCategoryItems(categoryItems);

	let id: number | undefined;
	const params = getHashParameters();
	if (params.has("itemID")) {
		id = parseInt(params.get("itemID"));
	} else if (document.querySelector("[class*='sellerListWrapper___']")) {
		const image = document.querySelector("[class*='sellerListWrapper___']").previousElementSibling.querySelector<HTMLImageElement>("img.torn-item");
		if (!image) return null;

		id = convertToNumber(image.src);
	}

	if (id !== undefined) {
		const itemSellers = findAllElements("[class*='rowWrapper___']:not(.tt-highlight-modified)")
			.map<ItemEntry>((element) => {
				const priceElement = element.querySelector("[class*='price___']");
				if (!priceElement) return null;

				return {
					element,
					price: convertToNumber(priceElement.textContent),
					id,
				};
			})
			.filter((item) => !!item);

		handleItemSellers(id, itemSellers);
	}

	if (params.has("itemID")) {
		const id = parseInt(params.get("itemID"));
		const itemSellers = findAllElements("[class*='rowWrapper___']:not(.tt-highlight-modified)")
			.map<ItemEntry>((element) => {
				const priceElement = element.querySelector("[class*='price___']");
				if (!priceElement) return null;

				return {
					element,
					price: convertToNumber(priceElement.textContent),
					id,
				};
			})
			.filter((item) => !!item);

		handleItemSellers(id, itemSellers);
	}
}

function highlightItems(items: Element[]) {
	const itemEntries = items
		.map<ItemEntry | null>((element) => {
			const image = element.querySelector<HTMLImageElement>("img.torn-item");
			if (!image) return null;

			const priceElement = element.querySelector("[class*='priceAndTotal'] > span");
			if (!priceElement) return null;

			return {
				element,
				id: convertToNumber(image.src),
				price: convertToNumber(priceElement.textContent),
			};
		})
		.filter((item) => item?.element);

	handleCategoryItems(itemEntries);
}

function highlightSellers(item: number, list: Element, includeModified: boolean) {
	const itemEntries = findAllElements(
		`[class*='rowWrapper___']${includeModified ? "" : ":not(.tt-highlight-modified)"},[class*='sellerRow___']:not(:first-child)${includeModified ? "" : ":not(.tt-highlight-modified)"}`,
		list,
	)
		.filter((element) => !!element.querySelector("[class*='price___']"))
		.map<ItemEntry>((element) => ({
			element,
			price: convertToNumber(element.querySelector("[class*='price___']").textContent),
			id: item,
		}));

	handleItemSellers(item, itemEntries);
}

/**
 * Should highlight the given item based on the price?
 */
function shouldHighlight(id: number, price: number) {
	const percentage = 1 - (settings.pages.itemmarket.highlightCheapItems as number) / 100;

	const value = ITEM_RESOLVER.getFullItem(id)?.value?.market_price;
	if (!value) return false;

	return value * percentage >= price;
}

function handleCategoryItems(items: ItemEntry[]) {
	let triggered = false;
	items.forEach(({ id, price, element }) => {
		if (shouldHighlight(id, price)) {
			element.classList.add("tt-highlight-item", "tt-highlight-modified");
			triggered = true;
		} else {
			element.classList.remove("tt-highlight-item");
			element.classList.add("tt-highlight-modified");
		}
	});

	if (triggered) playSound();
}

function handleItemSellers(id: number, items: ItemEntry[]) {
	items.forEach(({ price, element }) => {
		if (shouldHighlight(id, price)) {
			element.classList.add("tt-highlight-item", "tt-highlight-modified");
		} else {
			element.classList.remove("tt-highlight-item");
			element.classList.add("tt-highlight-modified");
		}
	});
}

function removeHighlights() {
	findAllElements(".tt-highlight-item").forEach((item) => item.classList.remove("tt-highlight-item"));
	findAllElements(".tt-highlight-modified").forEach((item) => item.classList.remove("tt-highlight-modified"));
}

function playSound() {
	if (!settings.pages.itemmarket.highlightCheapItemsSound) return;

	BACKGROUND_SERVICE.playNotificationSound(settings.notifications.sound, settings.notifications.volume);
}

export default class HighlightCheapItemsFeature extends Feature {
	constructor() {
		super("Highlight Cheap Items", "item market");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.itemmarket.highlightCheapItems !== "";
	}

	initialise() {
		initialiseListeners();
	}

	execute() {
		highlightEverything();
	}

	cleanup() {
		removeHighlights();
	}

	storageKeys() {
		return ["settings.pages.itemmarket.highlightCheapItems", "settings.pages.itemmarket.highlightCheapItemsSound"];
	}

	async requirements() {
		if (!ITEM_RESOLVER.hasFullItems()) return "No API access.";

		return true;
	}
}
