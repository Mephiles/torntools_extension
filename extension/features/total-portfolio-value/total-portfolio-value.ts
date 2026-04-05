import "./total-portfolio-value.css";
import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { settings, userdata } from "@/utils/common/data/database";
import { requireElement } from "@/utils/common/functions/requires";
import { sleep } from "@/utils/common/functions/utilities";
import { elementBuilder, findAllElements, mobile } from "@/utils/common/functions/dom";
import { convertToNumber, formatNumber } from "@/utils/common/functions/formatting";

async function addProfitAndValue() {
	await requireElement("#stockmarketroot [class*='stock___']");

	calculateAndShowProfits();

	const observer = new MutationObserver(async () => {
		if (!FEATURE_MANAGER.isEnabled(TotalPortfolioValueFeature)) return;

		await sleep(0.5);
		calculateAndShowProfits();
	});
	observer.observe(document.querySelector("#priceTab"), { attributeOldValue: true });
}

function calculateAndShowProfits() {
	removeProfitAndValue();

	const totalValue = findAllElements("[class*='stockOwned__'] [class*='value__']")
		.map((x) => convertToNumber(x.textContent))
		.reduce((a, b) => a + b, 0);
	const stockPrices = getStockPrices();
	const profits = findAllElements("#stockmarketroot [class*='stockMarket__'] > ul[id]")
		.map((x) => {
			const stockID = parseInt(x.id);
			const userStockData = userdata.stocks.find(({ id }) => stockID === id);
			if (!userStockData) return 0;

			const boughtTotal = Object.values(userStockData.transactions).reduce((prev, trans) => prev + trans.price * trans.shares, 0);
			const boughtPrice = boughtTotal / userStockData.shares;

			return Math.floor((stockPrices[stockID] - boughtPrice) * userStockData.shares);
		})
		.reduce((a, b) => a + b, 0);

	const shorten = mobile ? 2 : true;
	document.querySelector("#stockmarketroot h4").appendChild(
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
	if (mobile) document.querySelector("#stockmarketroot [class*='topSection__']").classList.add("tt-total-stock-value-wrap");
}

function getStockPrices() {
	const data: Record<string, number> = {};
	findAllElements("[class*='stockMarket__'] > ul[id]").forEach((stock) => {
		data[stock.id] = parseFloat(stock.querySelector("#priceTab > :first-child").textContent);
	});
	return data;
}

function removeProfitAndValue() {
	const ttTotalStockValue = document.querySelector("#stockmarketroot .tt-total-stock-value");
	if (ttTotalStockValue) ttTotalStockValue.remove();
	if (mobile) document.querySelector("#stockmarketroot [class*='topSection__']").classList.remove("tt-total-stock-value-wrap");
}

export default class TotalPortfolioValueFeature extends Feature {
	constructor() {
		super("Total Portfolio Value", "stocks");
	}

	isEnabled() {
		return settings.pages.stocks.valueAndProfit;
	}

	async execute() {
		await addProfitAndValue();
	}

	cleanup() {
		removeProfitAndValue();
	}

	storageKeys() {
		return ["settings.pages.stocks.valueAndProfit", "userdata.stocks"];
	}
}
