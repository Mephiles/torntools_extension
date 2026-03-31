import "./bazaar-sub-vendor-items.css";
import { ExecutionTiming, Feature } from "@/features/feature-manager";
import { settings, torndata } from "@/utils/common/data/database";
import { findAllElements } from "@/utils/common/functions/dom";
import { requireContent } from "@/utils/common/functions/requires";
import { convertToNumber } from "@/utils/common/functions/formatting";
import { hasAPIData } from "@/utils/common/functions/api";

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
function shouldHighlight(id: number | string, price: number) {
	return price < torndata.itemsMap[id]?.value.sell_price;
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

	requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
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
