"use strict";

(async () => {
	if (!getPageStatus().access) return;

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
		{ triggerCallback: true },
	);

	function initialiseMarketIcons() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_SWITCH_TAB].push(showMarketIcons);
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_ITEMS_LOADED].push(showMarketIcons);
	}

	async function showMarketIcons() {
		await requireItemsLoaded();

		let isFirst = true;
		let lastItem;
		for (const item of document.findAll(".items-cont[aria-expanded=true] > li[data-item]:not(.tt-ignore):not(.ajax-placeholder)")) {
			if (item.find(".market-link")) continue;

			if (item.classList.contains("item-group")) item.classList.add("tt-modified");

			const id = parseInt(item.dataset.item);
			if (!isSellable(id)) continue;

			let parent = item.find(".outside-actions");
			if (!parent) {
				parent = document.newElement({ type: "div", class: `outside-actions ${isFirst ? "first-action" : ""}` });

				item.appendChild(parent);
			}

			const name = item.find(".thumbnail-wrap").getAttribute("aria-label");

			parent.appendChild(
				document.newElement({
					type: "div",
					class: "market-link",
					children: [
						document.newElement({
							type: "a",
							href: `https://www.torn.com/imarket.php#/p=shop&step=shop&type=&searchname=${name}`,
							children: [document.newElement({ type: "i", class: "item-market-icon", attributes: { title: "Open Item Market" } })],
						}),
					],
				}),
			);

			isFirst = false;
			lastItem = item;
		}
		if (lastItem && lastItem.find(".outside-actions")) lastItem.find(".outside-actions").classList.add("last-action");
	}

	function removeMarketIcons() {
		for (const link of document.findAll(".market-link")) {
			link.remove();
		}
	}
})();
