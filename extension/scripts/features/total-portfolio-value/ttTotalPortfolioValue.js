"use strict";

(async () => {
	featureManager.registerFeature(
		"Total Portfolio Value and Profit",
		"stocks",
		() => settings.pages.stocks.valueAndProfit,
		null,
		addProfitAndValue,
		removeProfitAndValue,
		{
			storage: ["settings.pages.stocks.valueAndProfit"],
		},
		async () => {
			await checkDevice();
		},
	);

	async function addProfitAndValue() {
		await requireElement("#stockmarketroot [class*='stock___']");
		const totalValue = [...document.findAll("[class*='stockOwned__'] [class*='value__']")].map((x) => x.textContent.getNumber()).totalSum();
		const profits = [...document.findAll("#stockmarketroot [class*='stockMarket__'] > ul[id]")]
			.map((x) => {
				const stockID = x.id;
				const data = stockdata[stockID];
				const userStockData = userdata.stocks[stockID];
				if (!userStockData) return 0;

				const boughtTotal = Object.values(userStockData.transactions).reduce((prev, trans) => prev + trans.bought_price * trans.shares, 0);
				const boughtPrice = boughtTotal / userStockData.total_shares;

				return Math.floor((data.current_price - boughtPrice) * userStockData.total_shares);
			})
			.totalSum();

		const shorten = mobile ? 2 : true;
		document.find("#stockmarketroot h4").appendChild(
			document.newElement({
				type: "span",
				class: "tt-total-stock-value",
				children: [
					"Value: ",
					document.newElement({ type: "span", class: "value", text: formatNumber(totalValue, { currency: true, shorten }) }),
					" | Profit: ",
					document.newElement({
						type: "span",
						class: profits >= 0 ? "profit" : "loss",
						text: formatNumber(profits, { currency: true, shorten }),
					}),
				],
			}),
		);
		if (mobile) document.find("#stockmarketroot [class*='topSection__']").classList.add("tt-total-stock-value-wrap");
	}

	function removeProfitAndValue() {
		const ttTotalStockValue = document.find("#stockmarketroot .tt-total-stock-value");
		if (ttTotalStockValue) ttTotalStockValue.remove();
		if (mobile) document.find("#stockmarketroot [class*='topSection__']").classList.remove("tt-total-stock-value-wrap");
	}
})();
