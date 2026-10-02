import "./cost-to-next-stock.css";
import { settings, stockdata, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { elementBuilder } from "@common/utils/functions/dom";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { formatNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getCostToNextStockBlock, getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

async function showCostToNext() {
	await requireElement("#stockmarketroot [class*='stockMarket__'] > ul[class*='stock___'][id]");

	removeCostToNext();

	for (const row of findAllElements("#stockmarketroot [class*='stockMarket__'] > ul[class*='stock___'][id]")) {
		const id = parseInt(row.id);
		const stock = stockdata.stocks.find((entry) => entry.id === id);
		if (!stock) continue;

		const attachTarget = getAttachTarget(row);
		if (!attachTarget) continue;

		const shares = userdata.stocks.find((entry) => entry.id === id)?.shares ?? 0;
		const costToNext = getCostToNextStockBlock(stock, shares);
		if (!costToNext) continue;

		attachTarget.appendChild(
			elementBuilder({
				type: "span",
				class: "tt-cost-to-next",
				text: `Next BB: ${formatNumber(costToNext.cost, { currency: true, shorten: 2 })}`,
			}),
		);
	}
}

function getAttachTarget(row: Element): HTMLElement | null {
	const dividendInfo = findElement("li[class*='stockDividend__'] [class*='dividendInfo__']", row, true);
	if (dividendInfo?.checkVisibility()) return dividendInfo;

	// Mobile collapses the dividend column — attach under owned shares instead.
	return findElement("li[class*='stockOwned__']", row, true) ?? findElement("li[class*='stockPrice__']", row, true);
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
		return ["settings.pages.stocks.costToNext", "userdata.stocks", "stockdata.stocks"];
	}
}
