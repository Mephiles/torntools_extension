"use strict";

let activeTrade = false;

(async () => {
	await loadDatabase();
	console.log("TT: Trade - Loading script. ");

	storageListeners.settings.push(loadTrade);
	loadTrade();
	loadTradeOnce();

	console.log("TT: Trade - Script loaded.");
})();

function loadTrade() {
	requireElement(".user.left, .user.right, #inventory-stat-container").then(() => {
		const step = getHashParameters().get("step");

		switch (step) {
			case "add":
				break;
			default:
				console.log("Unknown trade step.", step);
		}
	});
}

function loadTradeOnce() {
	addXHRListener(({ detail: { page, xhr, json } }) => {
		if (page === "trade") {
			loadTrade();
		} else if (page === "inventory") {
			const params = new URLSearchParams(xhr.requestBody);

			const step = params.get("step");
			switch (step) {
				case "getList":
				case "getListById":
					ITEM_VALUES.showValues(params.get("type") || false, json.list).catch((error) => console.error("Couldn't show the item values.", error));
					break;
			}
		}
	});
}

function getItemCurrentList() {
	return document.find(".category-wrap ul.items-cont[style*='display:block;'], .category-wrap ul.items-cont[style*='display: block;']");
}

const ITEM_VALUES = {
	showValues: async (type, items) => {
		ITEM_VALUE_UTILITIES.removeTotal();

		if (settings.pages.items.values) {
			const list = getItemCurrentList();

			if (type) ITEM_VALUE_UTILITIES.showTotal(list, type);

			for (const item of items) {
				if (parseInt(item.untradable)) continue;

				requireElement(`li[data-reactid*='$${item.armoryID}'] .name-wrap`, { parent: list }).then(async () => {
					const parent = list.find(`li[data-reactid*='$${item.armoryID}'] .name-wrap`);
					if (parent.find(".tt-item-price")) {
						if (type) return;
						else parent.find(".tt-item-price").remove();
					}

					const price = parseInt(item.averageprice) || 0;
					const quantity = parseInt(item.Qty) || 1;

					const priceElement = document.newElement({ type: "span", class: "tt-item-price" });
					if (item.groupItem && quantity !== 1) priceElement.style.setProperty("padding-right", "98px", "important"); // 57

					ITEM_VALUE_UTILITIES.addValue(priceElement, quantity, price);

					if (item.groupItem) {
						if (quantity === 1) parent.insertAdjacentElement("afterend", priceElement);
						else parent.appendChild(priceElement);
					} else parent.insertAdjacentElement("afterend", priceElement);
				});
			}
		} else {
			for (const price of document.findAll(".tt-item-price, #category-wrap .tt-ignore")) {
				price.remove();
			}
		}
	},
};
