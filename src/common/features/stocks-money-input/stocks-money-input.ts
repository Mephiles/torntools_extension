import { settings } from "@common/utils/data/database";
import { elementBuilder, isHTMLElement } from "@common/utils/functions/dom";
import { findElement } from "@common/utils/functions/find-elements";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus, updateReactInput } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import styles from "./stocks-money-input.module.css";

const SELL_TAX_RATE = 0.001;

function parseMoneyInput(input: string): number | null {
	const normalized = input.replaceAll(/[$, ]/g, "").toLowerCase();

	let money: number;
	if (normalized.endsWith("k")) {
		money = parseFloat(normalized) * 1000;
	} else if (normalized.endsWith("m")) {
		money = parseFloat(normalized) * 1000 * 1000;
	} else if (normalized.endsWith("b")) {
		money = parseFloat(normalized) * 1000 * 1000 * 1000;
	} else {
		money = parseFloat(normalized);
	}

	return Number.isNaN(money) ? null : money;
}

function getActiveStockPrice(): number | null {
	const stockRow = findElement("[class*='stockOwned__'][class*='active__']", true)?.parentElement;
	if (!stockRow) return null;

	const priceElement = findElement("li[class*='stockPrice__'] [class*='price__']", stockRow, true);
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

		const stockInput = findElement<HTMLInputElement>(`[class*='stockDropdown__'] ${blockType} input.input-money:not([type='hidden'])`);
		updateReactInput(stockInput, quantity.toString());
	};
}

const INPUT_OBSERVERS: Record<string, MutationObserver> = {};

async function addMoneyInputs(event: { target: EventTarget | null }) {
	if (!isHTMLElement(event.target)) return;

	const stockOwnedElement = event.target.closest("li[class*='stockOwned__']");
	if (!stockOwnedElement) return;

	for (const blockSelector of ["[class*='buyBlock__']", "[class*='sellBlock__']"]) {
		if (findElement(`${blockSelector} .${styles.ttMoneyInput}`, true)) continue;

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
		if (findElement(`.${styles.ttMoneyInput}`, blockElement, true)) continue;

		findElement("[class*='manageBlock__']", blockElement).appendChild(moneyInputElement);

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

	findElement("[class*='stockMarket__']").addEventListener("click", addMoneyInputs);
	if (location.href.includes("&tab=owned")) {
		await addMoneyInputs({ target: findElement("li[class*='stockOwned__'][class*='active__']", true) });
	}

	document.body.classList.add(styles.ttStockMoneyInput);
}

export default class StocksMoneyInputFeature extends Feature {
	constructor() {
		super("Stocks Money Input", "stocks");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled(): boolean {
		return settings.pages.stocks.moneyInput;
	}

	override storageKeys(): string[] {
		return ["settings.pages.stocks.moneyInput"];
	}

	override async execute() {
		await addMoneyInputListeners();
	}
}
