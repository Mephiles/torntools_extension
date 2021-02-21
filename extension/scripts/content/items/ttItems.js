"use strict";

let pendingActions = {};

(async () => {
	addXHRListener((event) => {
		const { page, json, xhr } = event.detail;

		if (page === "item") {
			const params = new URLSearchParams(xhr.requestBody);
			const step = params.get("step");

			if (json && step === "useItem") {
				if (!json.success) return;

				if (params.get("step") !== "useItem") return;
				if (params.has("fac") && params.get("fac") !== "0") return;

				if (json.items) {
					for (const item of json.items.itemAppear) {
						window.dispatchEvent(
							new CustomEvent(EVENT_CHANNELS.ITEM_AMOUNT, { item: parseInt(item.ID), amount: parseInt(item.qty), reason: "usage" })
						);
					}
					for (const item of json.items.itemDisappear) {
						window.dispatchEvent(
							new CustomEvent(EVENT_CHANNELS.ITEM_AMOUNT, { item: parseInt(item.ID), amount: -parseInt(item.qty), reason: "usage" })
						);
					}
				} else {
					window.dispatchEvent(new CustomEvent(EVENT_CHANNELS.ITEM_AMOUNT, { item: parseInt(params.get("itemID")), amount: -1, reason: "usage" }));
				}
			} else if (json && step === "sendItemAction") {
				if (!json.success) return;

				const actionId = json.confirm ? json.itemID : params.get("XID");
				const item = json.confirm ? params.get("itemID") : pendingActions[actionId].item;
				const amount = json.amount;

				if (json.confirm) pendingActions[actionId] = { item };
				else {
					delete pendingActions[actionId];

					window.dispatchEvent(new CustomEvent(EVENT_CHANNELS.ITEM_AMOUNT, { item, amount: -amount, reason: "sending" }));
				}
			} else if (json && (step === "getCategoryList" || step === "getNotAllItemsListWithoutGroups" || step === "getItemsListByItemId")) {
				const tab = document.find("ul.items-cont.tab-menu-cont[style='display: block;'], ul.items-cont.tab-menu-cont:not([style])");
				if (!tab) return;

				new MutationObserver((mutations, observer) => {
					if (document.find("li.ajax-item-loader")) return;

					window.dispatchEvent(new CustomEvent(EVENT_CHANNELS.ITEM_ITEMS_LOADED, { tab }));

					observer.disconnect();
				}).observe(tab, { subtree: true, childList: true });
			}
		}
	});

	requireItemsLoaded().then(() => {
		for (let icon of document.findAll("ul[role=tablist] li:not(.no-items):not(.m-show):not(.hide)")) {
			icon.addEventListener("click", async () => {
				await requireItemsLoaded();

				window.dispatchEvent(new CustomEvent(EVENT_CHANNELS.ITEM_SWITCH_TAB, { tab: icon.dataset.type }));
			});
		}
	});
})();
