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
	window.addEventListener(EVENT_CHANNELS.ITEM_AMOUNT, (event) => {
		updateItemAmount(event.detail.item, event.detail.amount);
	});

	addXHRListener((event) => {
		const { page, json, xhr } = event.detail;

		if (page === "item") {
			const params = new URLSearchParams(xhr.requestBody);
			const step = params.get("step");

			if (json && (step === "getCategoryList" || step === "getNotAllItemsListWithoutGroups" || step === "getItemsListByItemId")) {
				const tab = document.find("ul.items-cont.tab-menu-cont[style='display: block;'], ul.items-cont.tab-menu-cont:not([style])");
				if (!tab) return;

				new MutationObserver((mutations, observer) => {
					if (document.find("li.ajax-item-loader")) return;

					showItemValues().catch((error) => console.error("Couldn't show the item values.", error));

					observer.disconnect();
				}).observe(tab, { subtree: true, childList: true });
			}
		}
	});

	requireItemsLoaded().then(() => {
		for (const icon of document.findAll("ul[role=tablist] li:not(.no-items):not(.m-show):not(.hide)")) {
			icon.addEventListener("click", () => requireItemsLoaded().then(initializeItems));
		}
	});
}

function initializeItems() {
	showItemValues().catch((error) => console.error("Couldn't show the item values.", error));
	MISSING_ITEMS.showFlowers((error) => console.error("Couldn't show the missing flowers.", error)).catch();
	MISSING_ITEMS.showPlushies((error) => console.error("Couldn't show the missing plushies.", error)).catch();
}

function updateItemAmount(id, change) {
	for (const item of document.findAll(`.items-cont > li[data-item="${id}"]`)) {
		const priceElement = item.find(".tt-item-price");
		if (!priceElement) continue;
		const quantityElement = priceElement.find(".tt-item-quantity");

		const price = torndata.items[id].market_value;
		const newQuantity = parseInt(quantityElement.innerText.match(/([0-9]*)x = /i)[1]) + change;

		if (newQuantity === 1) {
			priceElement.innerHTML = "";
			priceElement.appendChild(document.newElement({ type: "span", text: `$${formatNumber(price)}` }));
		} else {
			quantityElement.innerText = `${newQuantity}x = `;
			priceElement.find("span:last-child").innerText = `$${formatNumber(price * newQuantity)}`;
		}
	}
}

async function showItemValues() {
	// FIXME - Move to feature script.
	if (settings.pages.items.values && hasAPIData() && settings.apiUsage.user.inventory) {
		const list = document.find(".items-cont[aria-expanded=true]");
		const type = list.dataset.info;

		let total;
		if (type === "All") total = userdata.inventory.map((x) => x.quantity * x.market_price).totalSum();
		else
			total = userdata.inventory
				.filter((x) => x.type === type)
				.map((x) => x.quantity * x.market_price)
				.totalSum();

		for (const item of list.findAll(":scope > li[data-item]")) {
			const id = item.dataset.item;
			const price = torndata.items[id].market_value;

			const parent = mobile ? item.find(".name-wrap") : item.find(".bonuses-wrap") || item.find(".name-wrap");

			const quantity = parseInt(item.find(".item-amount.qty").innerText) || 1;
			const totalPrice = quantity * parseInt(price);

			if (parent.find(".tt-item-price")) continue;

			let priceElement;
			if (item.find(".bonuses-wrap")) {
				priceElement = document.newElement({ type: "li", class: "tt-item-price fl" });
			} else {
				priceElement = document.newElement({ type: "span", class: "tt-item-price" });

				if (item.find("button.group-arrow")) {
					priceElement.style.setProperty("padding-right", "30px", "important");
				}
			}
			if (mobile) {
				// priceElement.setAttribute("style", `op: 10px; float: unset !important; font-size: 11px;`);
				// parent.find(".name").setAttribute("style", "position: relative; top: -3px;");
				// parent.find(".qty").setAttribute("style", "position: relative; top: -3px;");
			}

			if (totalPrice) {
				if (quantity === 1) {
					priceElement.appendChild(document.newElement({ type: "span", text: `$${formatNumber(price)}` }));
				} else {
					priceElement.appendChild(document.newElement({ type: "span", text: `$${formatNumber(price)} | ` }));
					priceElement.appendChild(document.newElement({ type: "span", text: `${quantity}x = `, class: "tt-item-quantity" }));
					priceElement.appendChild(document.newElement({ type: "span", text: `$${formatNumber(totalPrice)}` }));
				}
			} else if (price === 0) {
				priceElement.innerText = `N/A`;
			} else {
				priceElement.innerText = `$${formatNumber(price)}`;
			}

			parent.appendChild(priceElement);
		}

		if (list.find(":scope > li > .tt-item-price")) list.find(":scope > li > .tt-item-price").parentElement.remove();

		list.insertBefore(
			document.newElement({
				type: "li",
				class: "tt-ignore",
				children: [
					document.newElement({
						type: "li",
						text: `Total Value: $${formatNumber(total, { decimals: 0 })}`,
						class: "tt-item-price",
					}),
				],
			}),
			list.firstElementChild
		);
	} else {
		for (const price of document.findAll(".tt-item-price, #category-wrap .tt-ignore")) {
			price.remove();
		}
	}
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
