import "./cost-to-next-stock.css";
import { settings, stockdata, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { elementBuilder } from "@common/utils/functions/dom";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { formatNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getCostToNextHighlight, getCostToNextStockBlock, getPageStatus } from "@common/utils/functions/torn";
import type { CostToNextHighlight } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

const HIGHLIGHT_CLASS: Record<Exclude<CostToNextHighlight, null>, string> = {
	cheapest: "tt-cost-to-next--cheapest",
	secondCheapest: "tt-cost-to-next--second",
	mostExpensive: "tt-cost-to-next--expensive",
};

async function showCostToNext() {
	await requireElement("#stockmarketroot [class*='stockMarket__'] > ul[class*='stock___'][id]");

	removeCostToNext();

	const entries: { info: HTMLElement; cost: number }[] = [];

	for (const row of findAllElements("#stockmarketroot [class*='stockMarket__'] > ul[class*='stock___'][id]")) {
		const id = parseInt(row.id);
		const stock = stockdata.stocks.find((entry) => entry.id === id);
		if (!stock) continue;

		const dividendInfo = findElement("li[class*='stockDividend__'] [class*='dividendInfo__']", row, true);
		if (!dividendInfo) continue;

		const shares = userdata.stocks.find((entry) => entry.id === id)?.shares ?? 0;
		const costToNext = getCostToNextStockBlock(stock, shares);
		if (!costToNext) continue;

		entries.push({ info: dividendInfo, cost: costToNext.cost });
	}

	const allCosts = entries.map((entry) => entry.cost);

	for (const entry of entries) {
		const highlight = getCostToNextHighlight(entry.cost, allCosts);
		const className = ["tt-cost-to-next"];
		if (highlight) className.push(HIGHLIGHT_CLASS[highlight]);

		entry.info.appendChild(
			elementBuilder({
				type: "span",
				class: className,
				text: `Next BB: ${formatNumber(entry.cost, { currency: true, shorten: 2 })}`,
			}),
		);
	}
}

function removeCostToNext() {
	findAllElements(".tt-cost-to-next").forEach((element) => element.remove());
}

export default class CostToNextStockFeature extends Feature {
	constructor() {
		super("Cost To Next Stock", "stocks");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override requirements() {
		if (!hasAPIData()) return "No API access.";
		return true;
	}

	override isEnabled() {
		return settings.pages.stocks.costToNext;
	}

	override async execute() {
		await showCostToNext();
	}

	override async reload() {
		if (!this.isEnabled()) {
			removeCostToNext();
			return;
		}
		await showCostToNext();
	}

	override storageKeys() {
		return ["settings.pages.stocks.costToNext", "userdata.stocks"];
	}
}
