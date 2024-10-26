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
			requireElement("[class*='sellerList___']").then((list) => handleSellerList(list, fetch));
		}
	});

	const hash = getHashParameters();
	const view = hash.get("market/view");
	if (view === "category" || view === "search") {
		requireElement("[class*='itemList___'],[class*='noItems___']").then(handleItemList);
	}
	if (view === "search") {
		requireElement("[class*='sellerList___']").then((list) => handleSellerList(list, fetch));
	}

	function isValidEntry(list) {
		return !list.className.includes("[class*='noItems___']");
	}

	function handleItemList(list) {
		if (!isValidEntry(list)) return;

		triggerCustomListener(EVENT_CHANNELS.ITEMMARKET_CATEGORY_ITEMS, { list });
	}

	function handleSellerList(list, fetch) {
		if (!isValidEntry(list)) return;

		triggerCustomListener(EVENT_CHANNELS.ITEMMARKET_ITEMS, { list, item: fetch.body?.itemID });
	}
})();
