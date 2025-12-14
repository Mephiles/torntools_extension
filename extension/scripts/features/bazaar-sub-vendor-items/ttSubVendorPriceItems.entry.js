"use strict";

(async () => {
	await featureManagerLoaded();

	const CLASS_NAME = "tt-sub-vendor-highlight";
	let observer;

	// noinspection JSIncompatibleTypesComparison
	featureManager.registerFeature(
		"Highlight Cheap Items",
		"bazaar",
		() => settings.pages.bazaar.highlightSubVendorItems !== "",
		initialise,
		highlightEverything,
		removeHighlights,
		{
			storage: ["settings.pages.bazaar.highlightSubVendorItems"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
		}
	);

	async function initialise() {
		observer = new MutationObserver(() => {
			highlightEverything();
		});

		requireContent().then(() => observer.observe(document.body, { childList: true, subtree: true }));
	}

	function highlightEverything() {
		const items = [...document.findAll("[class*='item__'] > [class*='itemDescription__']")]
			// filter out $1 items that you can't buy
			.filter((element) => !element.find("[class*='isBlockedForBuying___'"))
			.map((element) => {
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
	 * @param id {number|string}
	 * @param price {number}
	 * @returns {boolean}
	 */
	function shouldHighlight(id, price) {
		return price < torndata.items[id]?.sell_price;
	}

	function handleItem(item) {
		if (shouldHighlight(item.id, item.price)) {
			item.element.parentElement.classList.add(CLASS_NAME);
		} else {
			item.element.parentElement.classList.remove(CLASS_NAME);
		}
	}

	function removeHighlights() {
		observer?.disconnect();
		document.findAll(`.${CLASS_NAME}`).forEach((item) => item.classList.remove(CLASS_NAME));
	}
})();
