"use strict";

(async () => {
	if (!getPageStatus().access) return;

	if (!isAbroad()) return;

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

	async function addProfitsColumn() {
		await requireElement(".travel-agency-market .items-list-title");
		document.documentElement.classList.add("tt-travel-profits");
		if (document.find(".tt-travel-market-heading")) return;
		const market = document.find(".travel-agency-market");
		const headings = market.find(".items-list-title");

		const profitHeading = document.newElement({ type: "div", text: "Profit", class: `tt-travel-market-heading tt-title-${settings.themes.containers}` });
		headings.insertBefore(profitHeading, headings.find(".stock-b"));

		const devices = await checkDevice();
		if (devices.mobile || devices.tablet) document.find(".travel-agency-market").classList.add("tt-travel-profits-table");
		const rows = document.findAll(".users-list > li");
		for (let row of rows) {
			const id = parseInt(row.find(".details").getAttribute("itemid"));
			const marketPrice = parseInt(torndata.items[id].market_value);
			const buyPrice = parseInt(row.find(".cost .c-price").textContent.replace(/[$,]/g, ""));
			const profit = marketPrice - buyPrice;

			const span = document.newElement({ type: "span", class: "tt-travel-market-cell", attributes: { value: profit } });
			const innerSpan = document.newElement({ type: "span", text: `${profit < 0 ? "-$" : "+$"}${formatNumber(Math.abs(profit))}` });

			span.classList.remove("tt-color-green", "tt-color-red");
			if (buyPrice > marketPrice) span.classList.add("tt-color-red");
			else if (buyPrice < marketPrice) span.classList.add("tt-color-green");

			span.appendChild(innerSpan);
			row.find(".item-info-wrap").insertBefore(span, row.find(".item-info-wrap").find(".stock"));
		}
	}

	function removeProfitsColumn() {
		document.documentElement.classList.remove("tt-travel-profits");
		document.find(".travel-agency-market.tt-travel-profits-table")?.classList.remove("tt-travel-profits-table");
		document.findAll(".tt-travel-market-heading, .tt-travel-market-cell").forEach((x) => x.remove());
	}
})();
