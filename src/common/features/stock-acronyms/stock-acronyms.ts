import "./stock-acronyms.css";
import { settings, stockdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { elementBuilder } from "@common/utils/functions/dom";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

async function addAcronyms() {
	await requireElement("[class*='stockMarket__'] ul[class*='stock__'] [class*='nameContainer__']");

	for (const stockName of findAllElements("[class*='stockMarket__'] ul[class*='stock__'] [class*='stockName__']")) {
		const container = findElement("[class*='nameContainer__']", stockName);
		const id = parseInt(stockName.closest("[class*='stock___']")!.id);
		const stock = stockdata.stocks.find((s) => s.id === id);
		if (!stock) continue;

		const acronym = stock.acronym;

		container.classList.add("tt-acronym-container");
		container.insertAdjacentElement("afterbegin", elementBuilder({ type: "span", class: "tt-acronym", text: `(${acronym}) `, dataset: { acronym } }));
	}
}

export default class StockAcronymsFeature extends Feature {
	constructor() {
		super("Stock Acronyms", "stocks");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override requirements() {
		if (!hasAPIData()) return "No API access.";
		return true;
	}

	override isEnabled() {
		return settings.pages.stocks.acronyms;
	}

	override async execute() {
		await addAcronyms();
	}

	override storageKeys() {
		return ["settings.pages.stocks.acronyms"];
	}
}
