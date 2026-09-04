import "./market-icons.css";
import { settings } from "@common/utils/data/database";
import { checkDevice, elementBuilder } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { requireItemsLoaded } from "@common/utils/functions/requires";
import { getPageStatus, isSellable } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

function initialiseMarketIcons() {
	addCustomListener(EVENT_CHANNELS.ITEM_SWITCH_TAB, showMarketIcons);
	addCustomListener(EVENT_CHANNELS.ITEM_ITEMS_LOADED, showMarketIcons);
}

async function showMarketIcons() {
	await requireItemsLoaded();

	let isFirst = true;
	let lastItem: Element | undefined;
	for (const item of findAllElements(".items-cont[aria-expanded=true] > li[data-item]:not(.tt-ignore):not(.ajax-placeholder)")) {
		if (findElement(".market-link", item, true)) continue;

		if (item.classList.contains("item-group")) item.classList.add("tt-modified");

		const id = parseInt(item.dataset.item!);
		if (!isSellable(id)) continue;

		let parent = findElement(".outside-actions", item, true);
		if (!parent) {
			parent = elementBuilder({ type: "div", class: `outside-actions ${isFirst ? "first-action" : ""}` });

			item.appendChild(parent);
		}

		const name = findElement(".thumbnail-wrap", item).getAttribute("aria-label");
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
			}),
		);

		isFirst = false;
		lastItem = item;
	}
	const lastActions = lastItem ? findElement(".outside-actions", lastItem, true) : undefined;
	lastActions?.classList.add("last-action");
}

export default class MarketIconsFeature extends Feature {
	constructor() {
		super("Market Icons", "items");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.items.marketLinks;
	}

	override initialise() {
		initialiseMarketIcons();
	}

	override async execute() {
		await showMarketIcons();
	}

	override storageKeys() {
		return ["settings.pages.items.marketLinks"];
	}

	override async requirements() {
		if ((await checkDevice()).mobile) return "Not supported on mobile!";
		return true;
	}
}
