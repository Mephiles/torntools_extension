"use strict";

(async () => {
	addFetchListener(({ detail: { page, json, fetch } }) => {
		if (page !== "page" || !json) return;

		const params = new URL(fetch.url).searchParams;
		const sid = params.get("sid");
		if (sid !== "iMarket") return;

		const step = params.get("step");

		if (step === "getShopList" || step === "searchItem") {
			requireElement("[class*='itemList___'],[class*='noItems___']").then(handleItemList);
		} else if (step === "getListing") {
			requireElement("[class*='sellerList___']").then((list) => handleSellerList(list, fetch.body?.itemID));
		}
	});

	const hash = getHashParameters();
	const view = hash.get("market/view");
	if (view === "category" || view === "search") {
		requireElement("[class*='itemList___'],[class*='noItems___']").then(handleItemList);
	}
	if (view === "search" && hash.has("itemID")) {
		requireElement("[class*='sellerList___']").then((list) => handleSellerList(list, parseInt(hash.get("itemID"))));
	}

	function isValidEntry(list) {
		return !list.className.includes("[class*='noItems___']");
	}

	function handleItemList(list) {
		if (!isValidEntry(list)) return;

		triggerCustomListener(EVENT_CHANNELS.ITEMMARKET_CATEGORY_ITEMS, { list });
		[...list.findAll("[class*='itemList___'] > li:first-child")].forEach((itemElement) => {
			new MutationObserver(() => {
				triggerCustomListener(EVENT_CHANNELS.ITEMMARKET_CATEGORY_ITEMS_UPDATE, { item: itemElement });
			}).observe(itemElement.find("[class*='priceAndTotal___'] span:first-child"), { subtree: true, characterData: true });
		});
	}

	function handleSellerList(list, item) {
		if (!isValidEntry(list)) return;

		triggerCustomListener(EVENT_CHANNELS.ITEMMARKET_ITEMS, { item, list });
		new MutationObserver((mutations) => {
			const addedNodes = mutations.flatMap((mutation) => [...mutation.addedNodes]);
			if (addedNodes.length <= 0) return;

			triggerCustomListener(EVENT_CHANNELS.ITEMMARKET_ITEMS_UPDATE, { item, list });
		}).observe(list, { childList: true });
	}
})();
