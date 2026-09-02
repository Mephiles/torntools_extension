import "./bazaar-sub-vendor-items.css";
import { ITEM_RESOLVER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { convertToNumber } from "@common/utils/functions/formatting";
import { requireContent } from "@common/utils/functions/requires";
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
		.filter((element) => !findElement("[class*='isBlockedForBuying___']", element, true))
		.map<HighlightableItem>((element) => {
			return {
				element,
				id: convertToNumber(findElement("img", element).src),
				price: convertToNumber(findElement("[class*='price___']", element).textContent),
			};
		})
		.filter((item) => item.element);

	items.forEach((item) => handleItem(item));
}

/**
 * Should highlight the given item based on the price?
 */
function shouldHighlight(id: number, price: number) {
	return price < ITEM_RESOLVER.getStaticItem(id)?.value.sell_price;
}

function handleItem(item: HighlightableItem) {
	if (shouldHighlight(item.id, item.price)) {
		item.element.parentElement.classList.add(CLASS_NAME);
	} else {
		item.element.parentElement.classList.remove(CLASS_NAME);
	}
}

export default class BazaarSubVendorItemsFeature extends Feature {
	constructor() {
		super("Highlight Cheap Items", "bazaar", ExecutionTiming.DOM_INTERACTIVE);
	}

	override isEnabled() {
		return settings.pages.bazaar.highlightSubVendorItems;
	}

	override initialise() {
		initialise();
	}

	override execute() {
		highlightEverything();
	}

	override storageKeys() {
		return ["settings.pages.bazaar.highlightSubVendorItems"];
	}
}
