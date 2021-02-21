"use strict";

(async () => {
	const page = getPage();
	if (page === "item") return; // TODO - Switch later.

	if (page === "displaycase") {
		const userId = location.hash.startsWith("#display/") ? parseInt(location.hash.substring(9)) || false : false;

		if (userId && hasAPIData() && userId !== hasAPIData()) return;
	} else if (page === "bazaar") {
		const userId = parseInt(getSearchParameters().get("userId"));

		if (userId && hasAPIData() && userdata.player_id !== userId) return;
	} else if (page === "faction" && getSearchParameters().get("step") !== "your") return;

	featureManager.registerFeature(
		"Item Values",
		"items",
		() => settings.pages.items.values,
		initialiseItemValues,
		null, // FIXME - Check this.
		null, // FIXME - Check this.
		{
			storage: ["settings.pages.items.values"],
		},
		null
	);

	function initialiseItemValues() {
		switch (page) {
			case "bazaar":
			case "factions":
			case "itemuseparcel":
			case "trade":
				setupXHR({ addRelative: true });
				break;
			case "displaycase":
				setupXHR({ ignoreUntradable: true, addRelative: true });
				break;
			case "item": // TODO - Finish testing.
				break;
		}

		function setupXHR(options = {}) {
			addXHRListener(({ detail: { page, xhr, json } }) => {
				if (!json || page !== "inventory") return;

				handleRequest(xhr, json, options);
			});
		}

		function handleRequest(xhr, json, options = {}) {
			const params = new URLSearchParams(xhr.requestBody);

			const step = params.get("step");
			switch (step) {
				case "getList":
				case "getListById":
					showInventoryList(params.get("type") || false, json.list, options).catch((error) => console.error("Couldn't show the item values.", error));
					break;
			}
		}
	}

	async function showInventoryList(type, items, options = {}) {
		options = {
			ignoreUntradable: true,
			addRelative: false,
			...options,
		};

		const list = getCurrentList();
		removeTotal(list);

		if (settings.pages.items.values) {
			if (type) showTotal(list, type);

			for (const item of items) {
				if (options.ignoreUntradable && parseInt(item.untradable)) continue;

				requireElement(`li[data-reactid*='$${item.armoryID}'] .name-wrap`, { parent: list }).then(async () => {
					const itemRow = list.find(`li[data-reactid*='$${item.armoryID}']`);

					const parent = itemRow.find(".name-wrap");
					if (parent.find(".tt-item-price")) {
						if (type) return;
						else parent.find(".tt-item-price").remove();
					}

					if (options.addRelative) parent.parentElement.classList.add("relative");

					const price = parseInt(item.averageprice) || 0;
					const quantity = parseInt(item.Qty) || 1;

					const valueWrap = itemRow.find(".info-wrap");

					if (valueWrap && valueWrap.clientWidth && (!valueWrap.innerText.trim() || valueWrap.innerText.startsWith("$"))) {
						valueWrap.innerHTML = "";
						valueWrap.classList.add("tt-item-price-color");
						addValue(valueWrap, quantity, price);
					} else if (valueWrap && valueWrap.clientWidth && (!valueWrap.nextSibling || !valueWrap.nextSibling.childElementCount)) {
						valueWrap.style.setProperty("position", "relative");

						const priceElement = document.newElement({ type: "span", class: "tt-item-price" });
						addValue(priceElement, quantity, price);

						valueWrap.appendChild(priceElement);
					} else {
						const priceElement = document.newElement({ type: "span", class: "tt-item-price" });
						if (item.groupItem && quantity !== 1) priceElement.style.setProperty("padding-right", "98px", "important");

						addValue(priceElement, quantity, price);

						if (item.groupItem) {
							if (quantity === 1) parent.insertAdjacentElement("afterend", priceElement);
							else parent.appendChild(priceElement);
						} else parent.insertAdjacentElement("afterend", priceElement);
					}
				});
			}
		} else {
			for (const price of document.findAll(".tt-item-price, #category-wrap .tt-ignore")) {
				price.remove();
			}
		}

		function getCurrentList() {
			return document.find(".category-wrap ul.items-cont[style*='display:block;'], .category-wrap ul.items-cont[style*='display: block;']");
		}
	}

	function showTotal(list, type) {
		if (!hasAPIData() || !settings.apiUsage.user.inventory) return;

		let total;
		if (type === "All") total = userdata.inventory.map((x) => x.quantity * x.market_price).totalSum();
		else
			total = userdata.inventory
				.filter((x) => x.type === type)
				.map((x) => x.quantity * x.market_price)
				.totalSum();

		setTimeout(() => {
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
		}, 0);
	}

	function removeTotal(list) {
		const total = list.find(".tt-ignore .tt-item-price");
		if (total) total.parentElement.remove();
	}

	function addValue(priceElement, quantity, price) {
		const totalPrice = quantity * price;
		if (totalPrice) {
			if (quantity > 1) {
				priceElement.appendChild(document.newElement({ type: "span", text: `$${formatNumber(price)} | ` }));
				priceElement.appendChild(document.newElement({ type: "span", text: `${quantity}x = `, class: "tt-item-quantity" }));
			}
			priceElement.appendChild(document.newElement({ type: "span", text: `$${formatNumber(totalPrice)}` }));
		} else if (price === 0) {
			priceElement.innerText = `N/A`;
		} else {
			priceElement.innerText = `$${formatNumber(price)}`;
		}
	}
})();
