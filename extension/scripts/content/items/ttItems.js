"use strict";

const pendingActions = {};

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
					if (json.items.itemAppear) {
						for (const item of json.items.itemAppear) {
							triggerCustomListener(EVENT_CHANNELS.ITEM_AMOUNT, { item: parseInt(item.ID), amount: parseInt(item.qty), reason: "usage" });
						}
					}
					if (json.items.itemDisappear) {
						for (const item of json.items.itemDisappear) {
							triggerCustomListener(EVENT_CHANNELS.ITEM_AMOUNT, { item: parseInt(item.ID), amount: -parseInt(item.qty), reason: "usage" });
						}
					}
				} else {
					triggerCustomListener(EVENT_CHANNELS.ITEM_AMOUNT, { item: parseInt(params.get("itemID")), amount: -1, reason: "usage" });
				}
			} else if (json && step === "sendItemAction") {
				if (!json.success) return;

				const actionId = json.confirm ? json.itemID : params.get("XID");
				const item = json.confirm ? params.get("itemID") : pendingActions[actionId].item;
				const amount = json.amount;

				if (json.confirm) pendingActions[actionId] = { item };
				else {
					delete pendingActions[actionId];

					triggerCustomListener(EVENT_CHANNELS.ITEM_AMOUNT, { item, amount: -amount, reason: "sending" });
				}
			} else if (json && ["getCategoryList", "getNotAllItemsListWithoutGroups", "getItemsListByItemId", "getSearchList"].includes(step)) {
				const tab = document.find("ul.items-cont.tab-menu-cont[style='display: block;'], ul.items-cont.tab-menu-cont:not([style])");
				if (!tab) return;

				new MutationObserver((mutations, observer) => {
					if (document.find("li.ajax-item-loader")) return;

					triggerCustomListener(EVENT_CHANNELS.ITEM_ITEMS_LOADED, { tab, initial: false });

					observer.disconnect();
				}).observe(tab, { subtree: true, childList: true });
			} else if (step === "actionForm") {
				const action = params.get("action");

				if (action === "equip" && hasAPIData()) {
					const responseElement = document.newElement({ html: xhr.response });
					const textElement = responseElement.find("h5, [data-status]");

					if (textElement) {
						const text = textElement.textContent.trim();

						const regexResult = text.match(/You (unequipped|equipped) your (.*)\./i);
						if (regexResult) {
							const itemName = regexResult[2];
							const equipAction = regexResult[1];

							const item = findItemsInObject(torndata.items, { name: itemName }, { single: true });
							if (!item) return;

							triggerCustomListener(EVENT_CHANNELS.ITEM_EQUIPPED, { equip: equipAction === "equipped", item: item.id });
						}
					}
				}
			}
		}
	});

	requireItemsLoaded().then(() => {
		for (const icon of document.findAll("ul[role=tablist] li:not(.no-items):not(.m-show):not(.hide)")) {
			icon.addEventListener("click", async () => {
				await requireItemsLoaded();

				triggerCustomListener(EVENT_CHANNELS.ITEM_SWITCH_TAB, { tab: icon.dataset.type });
			});
		}
	});
})();
