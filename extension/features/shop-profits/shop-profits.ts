import "./shop-profits.css";
import { Feature } from "@/features/feature-manager";
import { hasAPIData } from "@/utils/common/functions/api";
import { getPageStatus } from "@/utils/common/functions/torn";
import { settings, torndata } from "@/utils/common/data/database";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { formatNumber } from "@/utils/common/functions/formatting";
import { PHFillCaretUp, PHFillCaretDown } from "@/utils/common/icons/phosphor-icons";

async function showProfits() {
	await requireElement(".item-desc");

	for (const item of findAllElements(".item-desc")) {
		const priceElement = item.querySelector(".price");
		if (priceElement.classList.contains("tt-modified")) continue;
		priceElement.classList.add("tt-modified");

		const id = parseInt(item.querySelector(".item").getAttribute("itemid"));

		const price = parseInt(priceElement.firstChild.textContent.replace(/[$,]/g, ""));
		const value = torndata.itemsMap[id].value.market_price;

		const profit = value - price;

		const profitElement = elementBuilder({ type: "span", class: "tt-profit" });
		if (profit > 0) {
			profitElement.classList.add("positive");
			profitElement.appendChild(PHFillCaretUp({ class: "profit-icon" }));
		} else if (profit < 0) {
			profitElement.classList.add("negative");
			profitElement.appendChild(PHFillCaretDown({ class: "profit-icon" }));
		}
		profitElement.appendChild(document.createTextNode(formatNumber(profit, { currency: true })));

		priceElement.appendChild(profitElement);
	}
}

export default class ShopProfitsFeature extends Feature {
	constructor() {
		super("Shop Profits", "shops");
	}

	precondition() {
		return getPageStatus().access;
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}

	isEnabled() {
		return settings.pages.shops.profit;
	}

	async execute() {
		await showProfits();
	}

	storageKeys() {
		return ["settings.pages.shops.profit"];
	}
}
