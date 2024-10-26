"use strict";

(async () => {
	if (!getPageStatus().access) return;

	// noinspection JSIncompatibleTypesComparison
	const feature = featureManager.registerFeature(
		"Highlight Cheap Items",
		"item market",
		() => settings.pages.itemmarket.highlightCheapItems !== "",
		initialiseListeners,
		highlightEverything,
		removeHighlights,
		{
			storage: ["settings.pages.itemmarket.highlightCheapItems"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
		}
	);

	async function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEMMARKET_CATEGORY_ITEMS].push(({ list }) => {
			if (!feature.enabled()) return;

			const itemEntries = [...list.findAll("[class*='itemList___'] > li:not(.tt-highlight-modified)")]
				.map((element) => {
					const image = element.find("img.torn-item");
					if (!image) return false;

					return {
						element,
						id: image.src.getNumber(),
						price: element.find("[class*='priceAndTotal'] > span").textContent.getNumber(),
					};
				})
				.filter((item) => item.element);

			handleCategoryItems(itemEntries);
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEMMARKET_ITEMS].push(({ item, list }) => {
			if (!feature.enabled()) return;

			highlightSellers(item, list, false);
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEMMARKET_ITEMS_UPDATE].push(({ item, list }) => {
			if (!feature.enabled()) return;

			highlightSellers(item, list, true);
		});
	}

	function highlightEverything() {
		const categoryItems = [...document.findAll("[class*='itemList___'] > li:not(.tt-highlight-modified)")]
			.map((element) => {
				const image = element.find("img.torn-item");
				if (!image) return false;

				return {
					element,
					id: image.src.getNumber(),
					price: element.find("[class*='priceAndTotal'] > span").textContent.getNumber(),
				};
			})
			.filter((item) => item.element);

		handleCategoryItems(categoryItems);

		const params = getHashParameters();
		if (params.has("itemID")) {
			const itemSellers = [...document.findAll("[class*='rowWrapper___']:not(.tt-highlight-modified)")].map((element) => ({
				element,
				price: element.find("[class*='price___']").textContent.getNumber(),
			}));

			handleItemSellers(parseInt(params.get("itemID")), itemSellers);
		}
	}

	function highlightSellers(item, list, includeModified) {
		const itemEntries = [...list.findAll(`[class*='rowWrapper___']${includeModified ? "" : ":not(.tt-highlight-modified)"}`)].map((element) => ({
			element,
			price: element.find("[class*='price___']").textContent.getNumber(),
		}));

		handleItemSellers(item, itemEntries);
	}

	/**
	 * Should highlight the given item based on the price?
	 * @param id {number|string}
	 * @param price {number}
	 * @returns {boolean}
	 */
	function shouldHighlight(id, price) {
		const percentage = 1 - settings.pages.itemmarket.highlightCheapItems / 100;

		const value = torndata.items[id]?.market_value;
		if (!value) return false;

		return value * percentage >= price;
	}

	function handleCategoryItems(items) {
		items.forEach(({ id, price, element }) => {
			if (shouldHighlight(id, price)) {
				element.classList.add("tt-highlight-item", "tt-highlight-modified");
			} else {
				element.classList.remove("tt-highlight-item");
				element.classList.add("tt-highlight-modified");
			}
		});
	}

	function handleItemSellers(id, items) {
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
		document.findAll(".tt-highlight-item").forEach((item) => item.classList.remove("tt-highlight-item"));
		document.findAll(".tt-highlight-modified").forEach((item) => item.classList.remove("tt-highlight-modified"));
	}
})();
