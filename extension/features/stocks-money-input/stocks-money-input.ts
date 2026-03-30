import "./stocks-money-input.css";
import { Feature } from "@/features/feature-manager";
import { getPageStatus, updateReactInput } from "@/utils/common/functions/torn";
import { settings } from "@/utils/common/data/database";
import { requireElement } from "@/utils/common/functions/requires";
import { elementBuilder, findAllElements, isHTMLElement } from "@/utils/common/functions/dom";

async function addMoneyInputs(e: { target: EventTarget }) {
	if (!isHTMLElement(e.target)) return;

	const stockOwnedElement = e.target.closest("li[class*='stockOwned__']");
	if (!stockOwnedElement) return;

	for (const blockType of ["[class*='buyBlock__']", "[class*='sellBlock__']"]) {
		const moneyInputElement = elementBuilder({
			type: "div",
			class: "tt-money-input",
			children: [
				elementBuilder({ type: "span", text: "TornTools money input:" }),
				elementBuilder({
					type: "input",
					events: {
						input: (e: Event) => {
							if (!isHTMLElement(e.target)) return;

							const input = (e.target as HTMLInputElement).value;
							let money: number;
							if (input.endsWith("k") || input.endsWith("K")) {
								money = parseFloat(input.substring(0, input.length)) * 1000;
							} else if (input.endsWith("m") || input.endsWith("M")) {
								money = parseFloat(input.substring(0, input.length)) * 1000 * 1000;
							} else if (input.endsWith("b") || input.endsWith("B")) {
								money = parseFloat(input.substring(0, input.length)) * 1000 * 1000 * 1000;
							} else {
								money = parseFloat(input);
							}
							if (isNaN(money)) return;

							const stockRow = document.querySelector("[class*='stockOwned__'][class*='active__']")?.parentElement;
							if (!stockRow) return;

							const stockPrice = parseFloat(stockRow.querySelector("li[class*='stockPrice__'] [class*='price__']").textContent);
							const quantityToPurchase = Math.ceil(money / stockPrice);
							if (quantityToPurchase <= 0) return;

							const stockBuyInput = document.querySelector(
								"[class*='stockDropdown__'] " + blockType + " input.input-money:not([type='hidden'])"
							) as HTMLInputElement;
							updateReactInput(stockBuyInput, quantityToPurchase.toString());
						},
					},
				}),
			],
		});

		(await requireElement("[class*='stockDropdown__'] " + blockType + " [class*='manageBlock__']")).appendChild(moneyInputElement);
	}
}

async function addMoneyInputListeners() {
	await requireElement("[class*='stockMarket__'] ul[class*='stock__'] li[class*='stockOwned__']");
	const stockMarketRoot = document.querySelector("[class*='stockMarket__']");
	stockMarketRoot.addEventListener("click", addMoneyInputs);

	if (location.href.includes("&tab=owned")) {
		await addMoneyInputs({ target: document.querySelector("li[class*='stockOwned__'][class*='active__']") });
	}

	document.body.classList.add("tt-stock-money-input");
}

function removeMoneyInputListeners() {
	document.querySelector("[class*='stockMarket__']")?.removeEventListener("click", addMoneyInputs);
	findAllElements(".tt-money-input").forEach((x) => x.remove());
	document.body.classList.remove("tt-stock-money-input");
}

export default class StocksMoneyInputFeature extends Feature {
	constructor() {
		super("Stocks Money Input", "stocks");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled(): boolean {
		return settings.pages.stocks.moneyInput;
	}

	storageKeys(): string[] {
		return ["settings.pages.stocks.moneyInput"];
	}

	async execute() {
		await addMoneyInputListeners();
	}

	cleanup() {
		removeMoneyInputListeners();
	}
}
