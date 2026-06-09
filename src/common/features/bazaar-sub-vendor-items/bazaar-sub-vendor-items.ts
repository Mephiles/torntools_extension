import "./bazaar-sub-vendor-items.css";
import { settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { findAllElements } from "@common/utils/functions/dom";
import { convertToNumber } from "@common/utils/functions/formatting";
import { requireContent } from "@common/utils/functions/requires";
import { loadItem } from "@common/utils/torn-api/items";
import { ExecutionTiming, Feature } from "@features/feature";

const CLASS_NAME = "tt-sub-vendor-highlight";
let observer: MutationObserver | undefined;

interface HighlightableItem {
	element: HTMLElement;
	id: number;
	price: number;
}

function initialise() {
	observer = new MutationObserver(() => {
		highlightEverything();
	});

	requireContent().then(() => observer.observe(document.body, { childList: true, subtree: true }));
}

function highlightEverything() {
	const items = findAllElements("[class*='item__'] > [class*='itemDescription__']")
		// filter out $1 items that you can't buy
		.filter((element) => !element.querySelector("[class*='isBlockedForBuying___']"))
		.map<HighlightableItem>((element) => {
			return {
				element,
				id: convertToNumber(element.querySelector("img").src),
				price: convertToNumber(element.querySelector("[class*='price___']").textContent),
			};
		})
		.filter((item) => item.element);

	items.forEach((item) => handleItem(item));
}

/**
 * Should highlight the given item based on the price?
 */
function shouldHighlight(id: number, price: number) {
	return price < loadItem(id)?.value.sell_price;
}

function handleItem(item: HighlightableItem) {
	if (shouldHighlight(item.id, item.price)) {
		item.element.parentElement.classList.add(CLASS_NAME);
	} else {
		item.element.parentElement.classList.remove(CLASS_NAME);
	}
}

function removeHighlights() {
	observer?.disconnect();
	findAllElements(`.${CLASS_NAME}`).forEach((item) => item.classList.remove(CLASS_NAME));
}

export default class BazaarSubVendorItemsFeature extends Feature {
	constructor() {
		super("Highlight Cheap Items", "bazaar", ExecutionTiming.DOM_INTERACTIVE);
	}

	isEnabled() {
		return settings.pages.bazaar.highlightSubVendorItems;
	}

	initialise() {
		initialise();
	}

	execute() {
		highlightEverything();
	}

	cleanup() {
		removeHighlights();
	}

	storageKeys() {
		return ["settings.pages.bazaar.highlightSubVendorItems"];
	}
}
