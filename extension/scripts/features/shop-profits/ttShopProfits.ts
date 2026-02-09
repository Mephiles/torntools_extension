(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Shop Profits",
		"shops",
		() => settings.pages.shops.profit,
		null,
		showProfits,
		removeProfits,
		{
			storage: ["settings.pages.shops.profit"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";

			return true;
		}
	);

	async function showProfits() {
		await requireElement(".item-desc");

		for (const item of findAllElements(".item-desc")) {
			const priceElement = item.querySelector(".price");
			if (priceElement.classList.contains("tt-modified")) continue;
			priceElement.classList.add("tt-modified");

			const id = parseInt(item.querySelector(".item").getAttribute("itemid"));

			const price = parseInt(priceElement.firstChild.textContent.replace(/[$,]/g, ""));
			const value = torndata.itemsMap[id].value.market_price;

			const profit = value - price;

			const profitElement = elementBuilder({ type: "span", class: "tt-profit" });
			if (profit > 0) {
				profitElement.classList.add("positive");
				profitElement.appendChild(elementBuilder({ type: "i", class: "fa-solid fa-caret-up" }));
			} else if (profit < 0) {
				profitElement.classList.add("negative");
				profitElement.appendChild(elementBuilder({ type: "i", class: "fa-solid fa-caret-down" }));
			}
			profitElement.appendChild(document.createTextNode(formatNumber(profit, { currency: true })));

			priceElement.appendChild(profitElement);
		}
	}

	function removeProfits() {}
})();
