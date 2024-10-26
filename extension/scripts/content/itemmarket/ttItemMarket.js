"use strict";

(async () => {
	const { mobile, tablet } = await checkDevice();

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

	const root = document.find("#item-market-root");

	const hash = getHashParameters();
	const view = hash.get("market/view");
	if (view === "category" || view === "search") {
		requireElement("[class*='itemList___'],[class*='noItems___']").then(handleItemList);
	}
	if (view === "search" && hash.has("itemID")) {
		requireElement("[class*='sellerList___']").then((list) => handleSellerList(list, parseInt(hash.get("itemID"))));
	}
	if (mobile || tablet) {
		new MutationObserver(async (mutations) => {
			const itemInfo = mutations
				.flatMap((mutation) => [...mutation.addedNodes])
				.filter((node) => node.nodeType === Document.ELEMENT_NODE)
				.find((element) => element.classList.contains("item-info"));
			if (!itemInfo) return;

			const item = parseInt(itemInfo.id.match(/wai-itemInfo-([0-9]+)-0/)[1]);

			triggerCustomListener(EVENT_CHANNELS.ITEMMARKET_ITEM_DETAILS, { item, element: itemInfo });
		}).observe(root, { childList: true, subtree: true });
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
		if (!mobile && !tablet) {
			new MutationObserver(async (mutations) => {
				const infoWrapper = mutations
					.flatMap((mutation) => [...mutation.addedNodes])
					.filter((node) => node.nodeType === Document.ELEMENT_NODE)
					.find((element) => element.className.includes("itemInfoWrapper___"));
				if (!infoWrapper) return;

				await requireElement(".tornPreloader", { invert: true });

				const item = parseInt(infoWrapper.find("img").src.match(/https:\/\/www\.torn\.com\/images\/items\/([0-9]+)\/.*\.png/)[1]);

				triggerCustomListener(EVENT_CHANNELS.ITEMMARKET_ITEM_DETAILS, { item, element: infoWrapper });
			}).observe(list, { childList: true });
		}
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
