"use strict";

(async () => {
	const VIEW_TYPES = {
		UNKNOWN: "unknown",
		BROWSE: "browse_view",
		ITEM: "item_view",
	};

	const feature = featureManager.registerFeature(
		"ItemMarket No Confirm",
		"no confirm",
		() => settings.scripts.noConfirm.marketBuy,
		initialise,
		startFeature,
		null,
		null,
		null,
	);

	function initialise() {
		new MutationObserver(async (mutations) => {
			if (!feature.enabled()) return;

			if (getViewType() === VIEW_TYPES.UNKNOWN) return;

			// Filter out changes where the main body doesn't get added.
			if (
				![...[...mutations].find((mutation) => mutation.addedNodes.length).addedNodes]
					.filter((node) => node.nodeType === Node.ELEMENT_NODE)
					.some((node) => node.classList.contains("main-market-page") || node.classList.contains("shop-market-page"))
			)
				return;

			startFeature();
		}).observe(document.find("#item-market-main-wrap"), { childList: true });
	}

	function startFeature() {
		switch (getViewType()) {
			case VIEW_TYPES.ITEM:
				requireElement(".buy .buy-link").then(() => removeConfirmation());
				break;
			case VIEW_TYPES.BROWSE:
				for (const list of document.findAll(".m-items-list")) {
					new MutationObserver(() => removeConfirmation(list)).observe(list, { childList: true, subtree: true });
				}
				break;
		}
	}

	function removeConfirmation(source = document) {
		const isItemView = getViewType() === VIEW_TYPES.ITEM;

		for (const item of source.findAll(".items > li:not(.clear):not(.private-bazaar)")) {
			const icon = item.find(".buy .buy-link");
			if (!icon) continue;

			icon.dataset.action = "buyItemConfirm";
			icon.classList.add("yes-buy", "tt-modified");

			if (isItemView) icon.dataset.price = item.find(".cost").textContent.getNumber();
		}
	}

	function getViewType() {
		if (!location.hash) return VIEW_TYPES.BROWSE;
		const page = getHashParameters().get("p");

		if (page === "shop") return VIEW_TYPES.ITEM;
		else if (page === "market") return VIEW_TYPES.BROWSE;

		return VIEW_TYPES.UNKNOWN;
	}
})();
