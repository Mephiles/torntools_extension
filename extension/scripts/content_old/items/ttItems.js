"use strict";

(async () => {
	await loadDatabase();
	console.log("TT: Items - Loading script. ");

	storageListeners.settings.push(loadItems);
	loadItems();

	loadItemsOnce();

	console.log("TT: Items - Script loaded.");
})();

function loadItems() {
	requireItemsLoaded().then(() => {
		initializeItems();
	});
}

function loadItemsOnce() {
	requireItemsLoaded().then(() => {
		for (const icon of document.findAll("ul[role=tablist] li:not(.no-items):not(.m-show):not(.hide)")) {
			icon.addEventListener("click", () => requireItemsLoaded().then(initializeItems));
		}
	});
}

function initializeItems() {
	MISSING_ITEMS.showFlowers((error) => console.error("Couldn't show the missing flowers.", error)).catch();
	MISSING_ITEMS.showPlushies((error) => console.error("Couldn't show the missing plushies.", error)).catch();
}

const MISSING_ITEMS = {
	showFlowers: async () => {
		await MISSING_ITEMS._show("needed-flowers", "#flowers-items", "missingFlowers", SETS.FLOWERS);
	},
	showPlushies: async () => {
		await MISSING_ITEMS._show("needed-plushies", "#plushies-items", "missingPlushies", SETS.PLUSHIES);
	},
	_show: async (name, categorySelector, settingName, itemSet) => {
		if (document.find(`#${name}`)) document.find(`#${name}`).remove();

		if (
			document.find(`#category-wrap > ${categorySelector}[aria-expanded='true']`) &&
			settings.pages.items[settingName] &&
			hasAPIData() &&
			settings.apiUsage.user.inventory
		) {
			const needed = itemSet.filter((x) => !userdata.inventory.some((y) => x.id === y.ID));
			if (needed.length <= 0) return;

			const wrapper = document.newElement({ type: "div", id: name });
			for (const item of needed.sort((a, b) => a.name.localeCompare(b.name))) {
				wrapper.appendChild(
					document.newElement({
						type: "div",
						class: "needed-item",
						children: [
							document.newElement({
								type: "img",
								attributes: { src: `https://www.torn.com/images/items/${item.id}/large.png`, alt: item.name },
							}),
							document.newElement({ type: "span", text: item.name }),
						],
						dataset: { id: item.id, name: item.name },
					})
				);
			}
			document.find(".main-items-cont-wrap").insertAdjacentElement("afterend", wrapper);
			showItemValuesMissingSets().catch((error) => console.error("Couldn't show item values for the missing set items.", error));
			showItemMarketIconsMissingSets().catch((error) => console.error("Couldn't show item values for the missing set items.", error));
		}
	},
};

async function showItemMarketIconsMissingSets() {
	if (settings.pages.items.marketLinks && !(await checkMobile())) {
		let isFirst = true;
		let lastItem;
		for (const item of document.findAll(".needed-item")) {
			if (item.find(".market-link")) continue;

			const id = parseInt(item.dataset.id);
			if (!isSellable(id)) continue;

			let parent = item.find(".outside-actions");
			if (!parent) {
				parent = document.newElement({ type: "div", class: `outside-actions ${isFirst ? "first-action" : ""}` });

				item.appendChild(parent);
			}

			const name = item.dataset.name;

			parent.appendChild(
				document.newElement({
					type: "div",
					class: "market-link",
					children: [
						document.newElement({
							type: "a",
							href: `https://www.torn.com/imarket.php#/p=shop&step=shop&type=&searchname=${name}`,
							children: [document.newElement({ type: "i", class: "torn-icon-item-market", attributes: { title: "Open Item Market" } })],
						}),
					],
				})
			);

			isFirst = false;
			lastItem = item;
		}
		if (lastItem && lastItem.find(".outside-actions")) lastItem.find(".outside-actions").classList.add("last-action");
	} else {
		for (const link of document.findAll(".market-link")) {
			link.remove();
		}
	}
}

async function showItemValuesMissingSets() {
	if (settings.pages.items.values && hasAPIData()) {
		for (const item of document.findAll(".needed-item")) {
			if (item.find(".tt-item-price")) continue;

			item.find(":scope > span").insertAdjacentElement(
				"afterend",
				document.newElement({
					type: "span",
					class: "tt-item-price",
					text: `$${formatNumber(torndata.items[parseInt(item.dataset.id)].market_value)}`,
				})
			);
		}
	} else {
		for (const price of document.findAll(".tt-item-price")) {
			price.remove();
		}
	}
}
