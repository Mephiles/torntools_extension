import "./market-icons.css";
import { Feature } from "@/features/feature-manager";
import { getPageStatus, isSellable } from "@/utils/common/functions/torn";
import { settings } from "@/utils/common/data/database";
import { checkDevice, elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { requireItemsLoaded } from "@/utils/common/functions/requires";

function initialiseMarketIcons() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_SWITCH_TAB].push(showMarketIcons);
	CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_ITEMS_LOADED].push(showMarketIcons);
}

async function showMarketIcons() {
	await requireItemsLoaded();

	let isFirst = true;
	let lastItem: Element | undefined;
	for (const item of findAllElements(".items-cont[aria-expanded=true] > li[data-item]:not(.tt-ignore):not(.ajax-placeholder)")) {
		if (item.querySelector(".market-link")) continue;

		if (item.classList.contains("item-group")) item.classList.add("tt-modified");

		const id = parseInt(item.dataset.item);
		if (!isSellable(id)) continue;

		let parent = item.querySelector(".outside-actions");
		if (!parent) {
			parent = elementBuilder({ type: "div", class: `outside-actions ${isFirst ? "first-action" : ""}` });

			item.appendChild(parent);
		}

		const name = item.querySelector(".thumbnail-wrap").getAttribute("aria-label");
		const category = item.dataset.category;

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

		isFirst = false;
		lastItem = item;
	}
	if (lastItem && lastItem.querySelector(".outside-actions")) lastItem.querySelector(".outside-actions").classList.add("last-action");
}

function removeMarketIcons() {
	for (const link of findAllElements(".market-link")) {
		link.remove();
	}
}

export default class MarketIconsFeature extends Feature {
	constructor() {
		super("Market Icons", "items");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.items.marketLinks;
	}

	initialise() {
		initialiseMarketIcons();
	}

	async execute() {
		await showMarketIcons();
	}

	cleanup() {
		removeMarketIcons();
	}

	storageKeys() {
		return ["settings.pages.items.marketLinks"];
	}

	async requirements() {
		if ((await checkDevice()).mobile) return "Not supported on mobile!";
		return true;
	}
}
