import "./total-item-cost.css";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { elementBuilder, isElement } from "@common/utils/functions/dom";
import { findElement } from "@common/utils/functions/find-elements";
import { formatNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

function initialiseListeners() {
	document.addEventListener("click", (event) => {
		if (
			FEATURE_MANAGER.isEnabled(TotalItemCostFeature) &&
			isElement(event.target) &&
			Array.from(event.target.classList).some((c) => c.startsWith("controlPanelButton__")) &&
			event.target.ariaLabel.includes("Buy")
		) {
			addPrice();
		}
	});
}

function addPrice() {
	requireElement("[class*='buyMenu_'] [class*='price_']").then(() => {
		if (findElement("#tt-total-cost", true)) return;
		findElement("[class*='buyMenu_'] [class*='amount_']").insertAdjacentElement("beforeend", elementBuilder({ type: "span", id: "tt-total-cost" }));
		const inputElement = findElement<HTMLInputElement>("[class*='buyMenu_'] [class*='buyForm_'] input[class*='numberInput_']");
		changeTotalPrice(parseInt(inputElement.value));
		inputElement.addEventListener("input", (event) => changeTotalPrice(parseInt((event.target as HTMLInputElement).value)));
	});
}

function changeTotalPrice(amount: number) {
	const stock = parseInt(findElement("[class*='buyMenu_'] [class*='amount_']").textContent.split(")")[0].replaceAll(/\D+/g, ""));
	const price = parseInt(findElement("[class*='buyMenu_'] [class*='price_']").textContent.split("$")[1].replaceAll(",", ""));
	if (amount > stock) amount = stock;
	if (findElement("#tt-total-cost", true)) findElement("#tt-total-cost").innerHTML = formatNumber(price * amount, { currency: true });
}

export default class TotalItemCostFeature extends Feature {
	constructor() {
		super("Total Item Cost", "bazaar");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.bazaar.itemsCost;
	}

	override initialise() {
		initialiseListeners();
	}

	override execute() {
		addPrice();
	}

	override storageKeys() {
		return ["settings.pages.bazaar.itemsCost"];
	}
}
