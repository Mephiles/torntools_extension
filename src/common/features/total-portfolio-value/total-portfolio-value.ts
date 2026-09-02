import "./total-portfolio-value.css";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { elementBuilder, mobile } from "@common/utils/functions/dom";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { convertToNumber, formatNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { sleep } from "@common/utils/functions/utilities";
import { Feature } from "@features/feature";

async function addProfitAndValue() {
	await requireElement("#stockmarketroot [class*='stock___']");

	calculateAndShowProfits();

	const observer = new MutationObserver(async () => {
		if (!FEATURE_MANAGER.isEnabled(TotalPortfolioValueFeature)) return;

		await sleep(0.5);
		calculateAndShowProfits();
	});
	observer.observe(findElement("#priceTab"), { attributeOldValue: true });
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
	findElement("#stockmarketroot h4").appendChild(
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
		}),
	);
	if (mobile) findElement("#stockmarketroot [class*='topSection__']").classList.add("tt-total-stock-value-wrap");
}

function getStockPrices() {
	const data: Record<string, number> = {};
	findAllElements("[class*='stockMarket__'] > ul[id]").forEach((stock) => {
		data[stock.id] = parseFloat(findElement("#priceTab > :first-child", stock).textContent);
	});
	return data;
}

function removeProfitAndValue() {
	const ttTotalStockValue = findElement("#stockmarketroot .tt-total-stock-value", true);
	if (ttTotalStockValue) ttTotalStockValue.remove();
	if (mobile) findElement("#stockmarketroot [class*='topSection__']").classList.remove("tt-total-stock-value-wrap");
}

export default class TotalPortfolioValueFeature extends Feature {
	constructor() {
		super("Total Portfolio Value", "stocks");
	}

	override requirements() {
		if (!hasAPIData()) return "No API access.";
		return true;
	}

	override isEnabled() {
		return settings.pages.stocks.valueAndProfit;
	}

	override async execute() {
		await addProfitAndValue();
	}

	override storageKeys() {
		return ["settings.pages.stocks.valueAndProfit", "userdata.stocks"];
	}
}
