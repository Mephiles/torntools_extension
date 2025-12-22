(async () => {
	if (!getPageStatus().access) return;

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

			return true;
		}
	);

	async function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEMMARKET_CATEGORY_ITEMS].push(({ list }) => {
			if (!feature.enabled()) return;

			highlightItems([...list.findAll("[class*='itemList___'] > li:not(.tt-highlight-modified)")]);
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEMMARKET_CATEGORY_ITEMS_UPDATE].push(({ item }) => {
			if (!feature.enabled()) return;

			highlightItems([item]);
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
			.map<ItemEntry | null>((element) => {
				const image = element.find<HTMLImageElement>("img.torn-item");
				if (!image) return null;

				return {
					element,
					id: image.src.getNumber(),
					price: element.find("[class*='priceAndTotal'] > span").textContent.getNumber(),
				};
			})
			.filter((item) => item?.element);

		handleCategoryItems(categoryItems);

		const params = getHashParameters();
		if (params.has("itemID")) {
			const id = parseInt(params.get("itemID"));
			const itemSellers = [...document.findAll("[class*='rowWrapper___']:not(.tt-highlight-modified)")].map<ItemEntry>((element) => ({
				element,
				price: element.find("[class*='price___']").textContent.getNumber(),
				id,
			}));

			handleItemSellers(id, itemSellers);
		}
	}

	interface ItemEntry {
		element: Element;
		price: number;
		id: number;
	}

	function highlightItems(items: Element[]) {
		const itemEntries = items
			.map<ItemEntry | null>((element) => {
				const image = element.find<HTMLImageElement>("img.torn-item");
				if (!image) return null;

				return {
					element,
					id: image.src.getNumber(),
					price: element.find("[class*='priceAndTotal'] > span").textContent.getNumber(),
				};
			})
			.filter((item) => item?.element);

		handleCategoryItems(itemEntries);
	}

	function highlightSellers(item: number, list: Element, includeModified: boolean) {
		const itemEntries = [
			...list.findAll(
				`[class*='rowWrapper___']${includeModified ? "" : ":not(.tt-highlight-modified)"},[class*='sellerRow___']:not(:first-child)${includeModified ? "" : ":not(.tt-highlight-modified)"}`
			),
		]
			.filter((element) => !!element.find("[class*='price___']"))
			.map<ItemEntry>((element) => ({
				element,
				price: element.find("[class*='price___']").textContent.getNumber(),
				id: item,
			}));

		handleItemSellers(item, itemEntries);
	}

	/**
	 * Should highlight the given item based on the price?
	 */
	function shouldHighlight(id: number, price: number) {
		const percentage = 1 - (settings.pages.itemmarket.highlightCheapItems as number) / 100;

		const value = torndata.items[id]?.market_value;
		if (!value) return false;

		return value * percentage >= price;
	}

	function handleCategoryItems(items: ItemEntry[]) {
		items.forEach(({ id, price, element }) => {
			if (shouldHighlight(id, price)) {
				element.classList.add("tt-highlight-item", "tt-highlight-modified");
			} else {
				element.classList.remove("tt-highlight-item");
				element.classList.add("tt-highlight-modified");
			}
		});
	}

	function handleItemSellers(id: number, items: ItemEntry[]) {
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
