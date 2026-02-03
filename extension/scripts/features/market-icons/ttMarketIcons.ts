(async () => {
	if (!getPageStatus().access) return false;

	if ((await checkDevice()).mobile) return "Not supported on mobile!";

	featureManager.registerFeature(
		"Market Icons",
		"items",
		() => settings.pages.items.marketLinks,
		initialiseMarketIcons,
		showMarketIcons,
		removeMarketIcons,
		{
			storage: ["settings.pages.items.marketLinks"],
		},
		null,
		{ triggerCallback: true }
	);

	function initialiseMarketIcons() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_SWITCH_TAB].push(showMarketIcons);
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_ITEMS_LOADED].push(showMarketIcons);
	}

	async function showMarketIcons() {
		await requireItemsLoaded();

		let isFirst = true;
		let lastItem: Element | undefined;
		for (const item of findAllElements(".items-cont[aria-expanded=true] > li[data-item]:not(.tt-ignore):not(.ajax-placeholder)")) {
			if (item.find(".market-link")) continue;

			if (item.classList.contains("item-group")) item.classList.add("tt-modified");

			const id = parseInt(item.dataset.item);
			if (!isSellable(id)) continue;

			let parent = item.find(".outside-actions");
			if (!parent) {
				parent = elementBuilder({ type: "div", class: `outside-actions ${isFirst ? "first-action" : ""}` });

				item.appendChild(parent);
			}

			const name = item.find(".thumbnail-wrap").getAttribute("aria-label");
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
				})
			);

			isFirst = false;
			lastItem = item;
		}
		if (lastItem && lastItem.find(".outside-actions")) lastItem.find(".outside-actions").classList.add("last-action");
	}

	function removeMarketIcons() {
		for (const link of findAllElements(".market-link")) {
			link.remove();
		}
	}

	return true;
})();
