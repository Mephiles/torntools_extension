"use strict";

(async () => {
	if (!getPageStatus().access) return;

	// noinspection JSIncompatibleTypesComparison
	const feature = featureManager.registerFeature(
		"Highlight Cheap Items",
		"bazaar",
		() => settings.pages.itemmarket.highlightSubVendorItems !== "",
		initialiseListeners,
		highlightEverything,
		removeHighlights,
		{
			storage: ["settings.pages.itemmarket.highlightSubVendorItems"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
		}
	);

	async function initialiseListeners() {
		addFetchListener(({ detail: { page, json, fetch } }) => {
			if (page === "bazaar" && json) {
				highlightEverything()
			}
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
			item.element.classList.add("tt-highlight-item");
		} else {
			item.element.classList.remove("tt-highlight-item");
		}
	}

	function removeHighlights() {
		document.findAll(".tt-highlight-item")
			.forEach((item) => item.classList.remove("tt-highlight-item"));
	}
})();