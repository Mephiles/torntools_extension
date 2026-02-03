(async () => {
	await featureManagerLoaded();

	const CLASS_NAME = "tt-sub-vendor-highlight";
	let observer: MutationObserver | undefined;

	featureManager.registerFeature(
		"Highlight Cheap Items",
		"bazaar",
		() => settings.pages.bazaar.highlightSubVendorItems,
		initialise,
		highlightEverything,
		removeHighlights,
		{
			storage: ["settings.pages.bazaar.highlightSubVendorItems"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";

			return true;
		}
	);

	async function initialise() {
		observer = new MutationObserver(() => {
			highlightEverything();
		});

		requireContent().then(() => observer.observe(document.body, { childList: true, subtree: true }));
	}

	interface HighlightableItem {
		element: HTMLElement;
		id: number;
		price: number;
	}

	function highlightEverything() {
		const items = findAllElements("[class*='item__'] > [class*='itemDescription__']")
			// filter out $1 items that you can't buy
			.filter((element) => !element.find("[class*='isBlockedForBuying___'"))
			.map<HighlightableItem>((element) => {
				return {
					element,
					id: element.find("img").src.getNumber(),
					price: element.find("[class*='price___']").textContent.getNumber(),
				};
			})
			.filter((item) => item.element);

		items.forEach((item) => handleItem(item));
	}

	/**
	 * Should highlight the given item based on the price?
	 */
	function shouldHighlight(id: number | string, price: number) {
		return price < torndata.items[id]?.sell_price;
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
})();
