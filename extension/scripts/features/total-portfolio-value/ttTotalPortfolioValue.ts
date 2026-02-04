(async () => {
	const feature = featureManager.registerFeature(
		"Total Portfolio Value and Profit",
		"stocks",
		() => settings.pages.stocks.valueAndProfit,
		null,
		addProfitAndValue,
		removeProfitAndValue,
		{
			storage: ["settings.pages.stocks.valueAndProfit", "userdata.stocks"],
		},
		async () => {
			await checkDevice();
			return true;
		}
	);

	async function addProfitAndValue() {
		await requireElement("#stockmarketroot [class*='stock___']");

		calculateAndShowProfits();

		const observer = new MutationObserver(async () => {
			if (!feature.enabled()) return;

			await sleep(0.5);
			calculateAndShowProfits();
		});
		observer.observe(document.find("#priceTab"), { attributeOldValue: true });
	}

	function calculateAndShowProfits() {
		removeProfitAndValue();

		const totalValue = findAllElements("[class*='stockOwned__'] [class*='value__']")
			.map((x) => convertToNumber(x.textContent))
			.reduce((a, b) => a + b, 0);
		const stockPrices = getStockPrices();
		const profits = findAllElements("#stockmarketroot [class*='stockMarket__'] > ul[id]")
			.map((x) => {
				const stockID = x.id;
				const userStockData = userdata.stocks[stockID];
				if (!userStockData) return 0;

				const boughtTotal = Object.values(userStockData.transactions).reduce((prev, trans) => prev + trans.bought_price * trans.shares, 0);
				const boughtPrice = boughtTotal / userStockData.total_shares;

				return Math.floor((stockPrices[stockID] - boughtPrice) * userStockData.total_shares);
			})
			.reduce((a, b) => a + b, 0);

		const shorten = mobile ? 2 : true;
		document.find("#stockmarketroot h4").appendChild(
			elementBuilder({
				type: "span",
				class: "tt-total-stock-value",
				children: [
					"Value: ",
					elementBuilder({ type: "span", class: "value", text: formatNumber(totalValue, { currency: true, shorten }) }),
					" | Profit: ",
					elementBuilder({
						type: "span",
						class: profits >= 0 ? "profit" : "loss",
						text: formatNumber(profits, { currency: true, shorten }),
					}),
				],
			})
		);
		if (mobile) document.find("#stockmarketroot [class*='topSection__']").classList.add("tt-total-stock-value-wrap");
	}

	function getStockPrices() {
		const data: Record<string, number> = {};
		findAllElements("[class*='stockMarket__'] > ul[id]").forEach((stock) => {
			data[stock.id] = parseFloat(stock.find("#priceTab > :first-child").textContent);
		});
		return data;
	}

	function removeProfitAndValue() {
		const ttTotalStockValue = document.find("#stockmarketroot .tt-total-stock-value");
		if (ttTotalStockValue) ttTotalStockValue.remove();
		if (mobile) document.find("#stockmarketroot [class*='topSection__']").classList.remove("tt-total-stock-value-wrap");
	}
})();
