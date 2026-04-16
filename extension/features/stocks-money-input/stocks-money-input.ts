import { Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { elementBuilder, findAllElements, isHTMLElement } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus, updateReactInput } from "@/utils/common/functions/torn";
import styles from "./stocks-money-input.module.css";

const SELL_TAX_RATE = 0.001;

function parseMoneyInput(input: string): number | null {
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
	return Number.isNaN(money) ? null : money;
}

function getActiveStockPrice(): number | null {
	const stockRow = document.querySelector("[class*='stockOwned__'][class*='active__']")?.parentElement;
	if (!stockRow) return null;

	const priceElement = stockRow.querySelector("li[class*='stockPrice__'] [class*='price__']");
	if (!priceElement) return null;

	const price = parseFloat(priceElement.textContent);
	return Number.isNaN(price) ? null : price;
}

function calculateBuyQuantity(money: number, stockPrice: number): number {
	return Math.floor(money / stockPrice);
}

function calculateSellQuantity(desiredEarnings: number, stockPrice: number): number {
	const moneyBeforeTax = desiredEarnings / (1 - SELL_TAX_RATE);
	return Math.ceil(moneyBeforeTax / stockPrice);
}

function createMoneyInputHandler(blockType: string) {
	return (e: Event) => {
		if (!isHTMLElement(e.target)) return;

		const money = parseMoneyInput((e.target as HTMLInputElement).value);
		if (money === null) return;

		const stockPrice = getActiveStockPrice();
		if (stockPrice === null) return;

		const quantity = blockType.includes("buyBlock") ? calculateBuyQuantity(money, stockPrice) : calculateSellQuantity(money, stockPrice);

		if (quantity <= 0) return;

		const stockInput = document.querySelector(`[class*='stockDropdown__'] ${blockType} input.input-money:not([type='hidden'])`) as HTMLInputElement;
		updateReactInput(stockInput, quantity.toString());
	};
}

const INPUT_OBSERVERS: Record<string, MutationObserver> = {};

async function addMoneyInputs(event: { target: EventTarget }) {
	if (!isHTMLElement(event.target)) return;

	const stockOwnedElement = event.target.closest("li[class*='stockOwned__']");
	if (!stockOwnedElement) return;

	for (const blockSelector of ["[class*='buyBlock__']", "[class*='sellBlock__']"]) {
		if (document.querySelector(`${blockSelector} .${styles.ttMoneyInput}`)) return;

		clearInputObserver(blockSelector);

		const moneyInputElement = elementBuilder({
			type: "div",
			class: styles.ttMoneyInput,
			children: [
				elementBuilder({ type: "span", text: "TornTools money input:" }),
				elementBuilder({
					type: "input",
					events: {
						input: createMoneyInputHandler(blockSelector),
					},
				}),
			],
		});

		const blockElement = await requireElement(blockSelector);
		blockElement.querySelector("[class*='manageBlock__']").appendChild(moneyInputElement);

		const observer = new MutationObserver(() => addMoneyInputs({ target: event.target }));
		observer.observe(blockElement, { childList: true });

		INPUT_OBSERVERS[blockSelector] = observer;
	}
}

function clearInputObserver(selector: string) {
	if (!(selector in INPUT_OBSERVERS)) return;

	INPUT_OBSERVERS[selector].disconnect();
	delete INPUT_OBSERVERS[selector];
}

async function addMoneyInputListeners() {
	await requireElement("[class*='stockMarket__'] ul[class*='stock__'] li[class*='stockOwned__']");

	document.querySelector<HTMLElement>("[class*='stockMarket__']").addEventListener("click", addMoneyInputs);
	if (location.href.includes("&tab=owned")) {
		await addMoneyInputs({ target: document.querySelector("li[class*='stockOwned__'][class*='active__']") });
	}

	document.body.classList.add(styles.ttStockMoneyInput);
}

function removeMoneyInputListeners() {
	document.querySelector("[class*='stockMarket__']")?.removeEventListener("click", addMoneyInputs);
	findAllElements(`.${styles.ttMoneyInput}`).forEach((x) => x.remove());
	document.body.classList.remove(styles.ttStockMoneyInput);
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
