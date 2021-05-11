"use strict";

(async () => {
	featureManager.registerFeature(
		"Travel Item Profits",
		"travel",
		() => settings.pages.travel.travelProfits,
		null,
		addProfitsColumn,
		removeProfitsColumn,
		{
			storage: ["settings.pages.travel.travelProfits"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
		}
	);

	function addProfitsColumn() {
		if (document.find(".tt-travel-market-heading")) return;
		const market = document.find(".travel-agency-market");
		const headings = market.find(".items-list-title");

		const profitHeading = document.newElement({ type: "div", text: "Profit", class: `tt-travel-market-heading tt-title-${settings.themes.containers}` });
		headings.insertBefore(profitHeading, headings.find(".stock-b"));

		const rows = document.findAll(".users-list > li");
		for (let row of rows) {
			const id = parseInt(row.find(".details").getAttribute("itemid"));
			const marketPrice = parseInt(torndata.items[id].market_value);
			const buyPrice = parseInt(row.find(".cost .c-price").innerText.replace(/[$,]/g, ""));
			const profit = marketPrice - buyPrice;

			const span = document.newElement({ type: "span", class: "tt-travel-market-cell", attributes: { value: profit } });
			const innerSpan = document.newElement({ type: "span", text: `${profit < 0 ? "-$" : "+$"}${formatNumber(Math.abs(profit))}` });

			if (buyPrice > marketPrice) span.style.color = "#de0000";
			else if (buyPrice < marketPrice) span.style.color = "#00a500";

			span.appendChild(innerSpan);
			row.find(".item-info-wrap").insertBefore(span, row.find(".item-info-wrap").find(".stock"));
		}
	}

	function removeProfitsColumn() {
		document.findAll(".tt-travel-market-cell, .tt-travel-market-heading").forEach((x) => x.remove());
	}
})();
