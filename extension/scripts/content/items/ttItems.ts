interface ActionItem {
	item: string;
}

const pendingActions: { [key: string]: ActionItem } = {};

(async () => {
	addXHRListener(({ detail }) => {
		const { page, xhr } = detail;
		if (page !== "item") return;

		const params = new URLSearchParams(xhr.requestBody);
		const step = params.get("step");

		if ("json" in detail) {
			const { json } = detail;

			if (isUseItem(step, json)) {
				if (!json.success) return;

				if (params.get("step") !== "useItem") return;
				if (params.has("fac") && params.get("fac") !== "0") return;

				if (json.items) {
					if (json.items.itemAppear) {
						json.items.itemAppear
							.filter((item): item is { ID: string; qty: string; type: string } => !("isMoney" in item))
							.forEach((item) => {
								triggerCustomListener(EVENT_CHANNELS.ITEM_AMOUNT, { item: parseInt(item.ID), amount: parseInt(item.qty), reason: "usage" });
							});
					}
					if (json.items.itemDisappear) {
						for (const item of json.items.itemDisappear) {
							triggerCustomListener(EVENT_CHANNELS.ITEM_AMOUNT, {
								item: parseInt(item.ID),
								amount: -parseInt(item.qty),
								reason: "usage",
							});
						}
					}
				} else {
					triggerCustomListener(EVENT_CHANNELS.ITEM_AMOUNT, { item: parseInt(params.get("itemID")), amount: -1, reason: "usage" });
				}
			} else if (isSendItemAction(step, json)) {
				if (!json.success) return;

				const actionId = "confirm" in json ? json.itemID : params.get("XID");
				const item = "confirm" in json ? params.get("itemID") : pendingActions[actionId].item;
				const amount = json.amount;

				if ("confirm" in json) pendingActions[actionId] = { item };
				else {
					delete pendingActions[actionId];

					triggerCustomListener(EVENT_CHANNELS.ITEM_AMOUNT, { item: parseInt(item), amount: -amount, reason: "sending" });
				}
			} else if (json && ["getCategoryList", "getNotAllItemsListWithoutGroups", "getItemsListByItemId", "getSearchList"].includes(step)) {
				const tab = getCurrentTab();
				if (!tab) return;

				new MutationObserver((_mutations, observer) => {
					if (document.find("li.ajax-item-loader")) return;

					triggerCustomListener(EVENT_CHANNELS.ITEM_ITEMS_LOADED, { tab, initial: false });

					observer.disconnect();
				}).observe(tab, { subtree: true, childList: true });
			}
		} else if (step === "actionForm") {
			const action = params.get("action");

			if (action === "equip" && hasAPIData()) {
				const responseElement = document.newElement({ type: "div", html: xhr.response });
				const textElement = responseElement.find("h5, [data-status]");

				if (textElement) {
					const text = textElement.textContent.trim();

					const regexResult = text.match(/You (unequipped|equipped) your (.*)\./i);
					if (regexResult) {
						const itemName = regexResult[2];
						const equipAction = regexResult[1];

						const item = findItemInObject(torndata.items, { name: itemName });
						if (!item) return;

						triggerCustomListener(EVENT_CHANNELS.ITEM_EQUIPPED, { equip: equipAction === "equipped", item: parseInt(item.id) });
					}
				}
			}
		}
	});

	requireItemsLoaded().then(() => {
		for (const icon of document.findAll("#categoriesList > li:not(.no-items):not(.m-show):not(.hide)")) {
			icon.addEventListener("click", async () => {
				await requireItemsLoaded();

				triggerCustomListener(EVENT_CHANNELS.ITEM_SWITCH_TAB, { tab: icon.dataset.type });
			});
		}

		triggerCustomListener(EVENT_CHANNELS.ITEM_ITEMS_LOADED, { tab: getCurrentTab(), initial: false });
	});

	function getCurrentTab() {
		return document.find("ul.items-cont.tab-menu-cont[style='display: block;'], ul.items-cont.tab-menu-cont:not([style])");
	}
})();

type TornInternalUseItem =
	| {
			success: false;
			text: string;
	  }
	| {
			action?: "useItem";
			inputs?: [];
			links: { title: string; url: string; class: string; attr: string }[];
			success: true;
			text: string;

			itemBloodBag?: string;
			itemCreate?: true;
			itemID?: string;
			items?: {
				itemAppear: ({ ID: string; qty: string; type: string } | { moneyGain: string; isMoney: true })[];
				itemDisappear: { ID: string; qty: string; type: string }[];
			};
	  };

function isUseItem(step: string, _json: any): _json is TornInternalUseItem {
	return step === "useItem";
}

type TornInternalSendItemAction =
	| {
			amount: number;
			confirm: true;
			itemID: number;
			success: boolean;
			tag: string;
			text: string;
			title: string;
			userID: string;
	  }
	| {
			amount: number;
			count: number;
			nextItemID: number;
			success: boolean;
			text: string;
	  };

function isSendItemAction(step: string, _json: any): _json is TornInternalSendItemAction {
	return step === "sendItemAction";
}
