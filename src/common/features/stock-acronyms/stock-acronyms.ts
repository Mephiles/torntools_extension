import "./stock-acronyms.css";
import { settings, stockdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { elementBuilder, findAllElements } from "@common/utils/functions/dom";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

async function addAcronyms() {
	await requireElement("[class*='stockMarket__'] ul[class*='stock__'] [class*='nameContainer__']");

	for (const stockName of findAllElements("[class*='stockMarket__'] ul[class*='stock__'] [class*='stockName__']")) {
		const container = stockName.querySelector("[class*='nameContainer__']");

		const id = stockName.closest("[class*='stock___']").id;
		if (typeof stockdata[id] === "number") continue;

		const acronym = stockdata[id].acronym;

		container.classList.add("tt-acronym-container");
		container.insertAdjacentElement("afterbegin", elementBuilder({ type: "span", class: "tt-acronym", text: `(${acronym}) `, dataset: { acronym } }));
	}
}

function removeAcronyms() {
	findAllElements(".tt-acronym").forEach((x) => x.remove());
}

export default class StockAcronymsFeature extends Feature {
	constructor() {
		super("Stock Acronyms", "stocks");
	}

	precondition() {
		return getPageStatus().access;
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";
		return true;
	}

	isEnabled() {
		return settings.pages.stocks.acronyms;
	}

	async execute() {
		await addAcronyms();
	}

	cleanup() {
		removeAcronyms();
	}

	storageKeys() {
		return ["settings.pages.stocks.acronyms"];
	}
}
