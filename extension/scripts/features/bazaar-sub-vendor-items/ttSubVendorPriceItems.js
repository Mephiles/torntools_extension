"use strict";

(async () => {
	await featureManagerLoaded();

	// noinspection JSIncompatibleTypesComparison
	featureManager.registerFeature(
		"Highlight Cheap Items",
		"bazaar",
		() => true /* settings.pages.bazaar.highlightSubVendorItems !== "" */,
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

	var observer;
	async function initialise() {
		observer = new MutationObserver(() => { highlightEverything() });
		observer.observe(document.body, {
			childList: true,
			subtree: true
		});
	}

	function highlightEverything() {
		const items = [...document.findAll("[class*='item__'] > [class*='itemDescription__']")]	
			.map((element) => { 
				return { 
					element,
					id: element.find("img").src.getNumber(), 
					price: element.find("[class*='price___']").textContent.getNumber()
				} 
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
			item.element.find("[class*='description___']").classList.add("tt-highlight-item");
		} else {
			item.element.find("[class*='description___']").classList.remove("tt-highlight-item");
		}
	}

	function removeHighlights() {
		observer?.disconnect();
		document.findAll(".tt-highlight-item")
			.forEach((item) => item.classList.remove("tt-highlight-item"));
	}
})();