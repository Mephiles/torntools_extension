import styles from "./hide-stocks.module.css";
import { Feature } from "@/features/feature-manager";
import { createMessageBox, getPageStatus } from "@/utils/common/functions/torn";
import { settings } from "@/utils/common/data/database";
import { requireElement } from "@/utils/common/functions/requires";
import { findAllElements } from "@/utils/common/functions/dom";

async function hideStocks() {
	await requireElement("#stockmarketroot [class*='stock___'][id]");
	unhideStocks();
	findAllElements("#stockmarketroot [class*='stock___'][id]").forEach((stockNode) => {
		if (settings.hideStocks.some((x) => x === stockNode.getAttribute("id"))) {
			stockNode.classList.add(styles.hiddenStock);
		}
	});
	document
		.querySelector("#stockmarketroot [class*='appHeaderWrapper__']")
		.insertAdjacentElement("afterend", createMessageBox("Some stocks have been hidden.", { class: styles.ttStocksHidden }));
}

function unhideStocks() {
	findAllElements("#stockmarketroot .tt-hidden[class*='stock___'][id]").forEach((stockNode) => stockNode.classList.remove(styles.hiddenStock));
	document.querySelector(".tt-stocks-hidden")?.remove();
}

export default class HideStocksFeature extends Feature {
	constructor() {
		super("Hide Stocks", "stocks");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.hideStocks.length > 0;
	}

	async execute() {
		await hideStocks();
	}

	cleanup() {
		unhideStocks();
	}

	storageKeys() {
		return ["settings.hideStocks"];
	}
}
