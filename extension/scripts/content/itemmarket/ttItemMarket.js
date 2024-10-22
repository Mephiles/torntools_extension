"use strict";

(async () => {
	addFetchListener(({ detail: { page, json, fetch } }) => {
		if (page !== "page" || !json) return;

		const params = new URL(fetch.url).searchParams;
		const sid = params.get("sid");
		if (sid !== "iMarket") return;

		const step = params.get("step");

		if (step === "getShopList" || step === "searchItem") {
			requireElement("[class*='itemList___'],[class*='noItems___']").then((list) => {
				if (isValidEntry(list)) triggerCustomListener(EVENT_CHANNELS.ITEMMARKET_CATEGORY_ITEMS, { list });
			});
		} else if (step === "getListing") {
			requireElement("[class*='sellerList___']").then((list) => {
				if (isValidEntry(list)) triggerCustomListener(EVENT_CHANNELS.ITEMMARKET_ITEMS, { list, item: fetch.body?.itemID });
			});
		}
	});

	function isValidEntry(list) {
		return !list.className.includes("[class*='noItems___']");
	}

	const hash = getHashParameters();
	const view = hash.get("market/view");
	if (view === "category" || view === "search") {
		requireElement("[class*='itemList___'],[class*='noItems___']").then((list) => {
			if (isValidEntry(list)) triggerCustomListener(EVENT_CHANNELS.ITEMMARKET_CATEGORY_ITEMS, { list });
		});
	}
	if (view === "search") {
		const item = parseInt(hash.get("itemID"));

		requireElement("[class*='sellerList___']").then((list) => {
			if (isValidEntry(list)) triggerCustomListener(EVENT_CHANNELS.ITEMMARKET_ITEMS, { list, item });
		});
	}
})();
