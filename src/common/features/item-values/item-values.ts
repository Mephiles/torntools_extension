import "./item-values.css";
import { isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER, ITEM_RESOLVER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { elementBuilder, getSearchParameters, isElement, mobile, tablet } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { formatNumber } from "@common/utils/functions/formatting";
import { addXHRListener } from "@common/utils/functions/listeners";
import { requireElement, requireItemsLoaded } from "@common/utils/functions/requires";
import type { XHRDetails } from "@common/utils/functions/script-injector";
import { getPage, getPageStatus, getUserDetails } from "@common/utils/functions/torn";
import { sleep } from "@common/utils/functions/utilities";
import { Feature } from "@features/feature";

const page = getPage();

interface ItemValuesXHROptions {
	addRelative?: boolean;
	ignoreUntradable?: boolean;
}

function initialiseItemValues() {
	switch (page) {
		case "bazaar":
		case "factions":
		case "itemuseparcel":
		case "trade":
			setupXHR({ addRelative: true });
			break;
		case "displaycase":
			setupXHR({ ignoreUntradable: true, addRelative: true });
			break;
		case "item":
			addCustomListener(EVENT_CHANNELS.ITEM_ITEMS_LOADED, ({ tab }) => {
				if (!FEATURE_MANAGER.isEnabled(ItemValuesFeature)) return;

				showItemValues(tab);
			});
			addCustomListener(EVENT_CHANNELS.ITEM_AMOUNT, ({ item, amount, loaned }) => {
				updateItemAmount(item, amount, loaned);
			});
			break;
	}

	function setupXHR(options: ItemValuesXHROptions = {}) {
		addXHRListener(({ detail: { page, xhr, json } }) => {
			if (!json || page !== "inventory") return;

			handleRequest(xhr, json, options);
		});
	}

	function handleRequest(xhr: XHRDetails["xhr"], json: any, options: ItemValuesXHROptions = {}) {
		const params = new URLSearchParams(xhr.requestBody);

		const step = params.get("step");
		switch (step) {
			case "getList":
			case "getListById":
				showInventoryList(params.get("type") || null, json.list, options).catch((error) => console.error("Couldn't show the item values.", error));
				break;
		}
	}
}

async function showInventoryList(type: string | null, items: any[], partialOptions: ItemValuesXHROptions = {}) {
	const options: Required<ItemValuesXHROptions> = {
		ignoreUntradable: true,
		addRelative: false,
		...partialOptions,
	};

	if (settings.pages.items.values) {
		const list = getCurrentList();

		for (const item of items) {
			if (options.ignoreUntradable && parseInt(item.untradable)) continue;

			requireElement(`li[data-reactid*='$${item.armoryID}'] .name-wrap`, { parent: list })
				.then(async () => {
					await sleep(0);
					const itemRow = findElement(`li[data-reactid*='$${item.armoryID}']`, list);

					const parent = findElement(".name-wrap", itemRow);
					if (findElement(".tt-item-price", parent, true)) {
						if (type) return;
						else findElement(".tt-item-price", parent).remove();
					}

					if (options.addRelative) parent.parentElement!.classList.add("relative");

					const price = parseInt(item.averageprice) || 0;
					const quantity = parseInt(item.Qty) || 1;

					const valueWrap = findElement(".info-wrap", itemRow, true);

					if (valueWrap?.clientWidth && (!valueWrap.textContent.trim() || valueWrap.textContent.startsWith("$"))) {
						valueWrap.innerHTML = "";
						valueWrap.classList.add("tt-item-price-color");
						addValue(valueWrap, quantity, price);
					} else if (valueWrap?.clientWidth && (!isElement(valueWrap.nextSibling) || !valueWrap.nextSibling.childElementCount)) {
						valueWrap.style.setProperty("position", "relative");

						const priceElement = elementBuilder({ type: "span", class: "tt-item-price" });
						addValue(priceElement, quantity, price);

						valueWrap.appendChild(priceElement);
					} else {
						const priceElement = elementBuilder({ type: "span", class: "tt-item-price" });
						if (item.groupItem && quantity !== 1) priceElement.style.setProperty("padding-right", "98px", "important");

						addValue(priceElement, quantity, price);

						if (item.groupItem) {
							if (quantity === 1) parent.insertAdjacentElement("afterend", priceElement);
							else parent.appendChild(priceElement);
						} else parent.insertAdjacentElement("afterend", priceElement);
					}
				})
				.catch(() => {});
		}
	} else {
		for (const price of findAllElements(".tt-item-price, #category-wrap .tt-ignore")) {
			price.remove();
		}
	}

	function getCurrentList() {
		return findElement(".category-wrap ul.items-cont[style*='display:block;'], .category-wrap ul.items-cont[style*='display: block;']");
	}
}

function addValue(priceElement: Element, quantity: number, price: number) {
	const totalPrice = quantity * price;
	if (totalPrice) {
		if (quantity > 1) {
			priceElement.appendChild(
				elementBuilder({
					type: "span",
					text: `${formatNumber(price, { currency: true })} | `,
				}),
			);
			priceElement.appendChild(
				elementBuilder({
					type: "span",
					text: `${quantity}x = `,
					class: "tt-item-quantity",
				}),
			);
		}
		priceElement.appendChild(
			elementBuilder({
				type: "span",
				text: formatNumber(totalPrice, { currency: true }),
			}),
		);
	} else if (price === 0) {
		priceElement.textContent = "N/A";
	} else {
		priceElement.textContent = formatNumber(price, { currency: true });
	}
}

function showItemValues(list: HTMLElement) {
	if (!list.dataset) return;

	for (const item of findAllElements(":scope > li[data-item]", list)) {
		const id = parseInt(item.dataset.item!);
		const fullItem = ITEM_RESOLVER.getFullItem(id);
		if (!fullItem) continue;
		const price = fullItem.value.market_price;

		const parent = mobile || tablet ? findElement(".name-wrap", item) : (findElement(".bonuses-wrap", item, true) ?? findElement(".name-wrap", item));

		const quantity = parseInt(findElement(".item-amount.qty", item).textContent) || 1;
		const totalPrice = quantity * price;

		if (findElement(".tt-item-price", parent, true)) continue;

		let priceElement: HTMLElement;
		if (findElement(".bonuses-wrap", item, true)) {
			priceElement = elementBuilder({ type: "li", class: "tt-item-price fl" });
		} else {
			priceElement = elementBuilder({ type: "span", class: "tt-item-price" });

			if (findElement("button.group-arrow", item, true)) {
				priceElement.style.setProperty("padding-right", "30px", "important");
			}
		}

		if (totalPrice) {
			if (quantity === 1) {
				priceElement.appendChild(
					elementBuilder({
						type: "span",
						text: formatNumber(price, { currency: true }),
					}),
				);
			} else {
				priceElement.appendChild(
					elementBuilder({
						type: "span",
						text: `${formatNumber(price, { currency: true })} | `,
					}),
				);
				priceElement.appendChild(
					elementBuilder({
						type: "span",
						text: `${quantity}x = `,
						class: "tt-item-quantity",
					}),
				);
				priceElement.appendChild(
					elementBuilder({
						type: "span",
						text: formatNumber(totalPrice, { currency: true }),
					}),
				);
			}
		} else if (price === 0) {
			priceElement.textContent = "N/A";
		} else {
			priceElement.textContent = formatNumber(price, { currency: true });
		}

		parent.appendChild(priceElement);
	}
}

function updateItemAmount(id: number, change: number, loaned?: boolean) {
	for (const item of findAllElements(`.items-cont > li[data-item="${id}"]`)) {
		if (typeof loaned === "boolean") {
			let isLoaned: boolean | undefined;
			if (item.dataset.rowkey?.includes("f")) {
				isLoaned = !item.dataset.rowkey.endsWith("f0");
			}

			if (typeof isLoaned === "boolean" && loaned !== isLoaned) continue;
		}

		const fullItem = ITEM_RESOLVER.getFullItem(id);
		if (!fullItem) continue;

		const priceElement = findElement(".tt-item-price", item, true);
		if (!priceElement) continue;

		const quantityElement = findElement(".tt-item-quantity", priceElement, true);
		if (!quantityElement) continue;

		const price = fullItem.value.market_price;
		const newQuantity = parseInt(quantityElement.textContent.match(/(\d*)x = /i)![1]) + change;

		if (newQuantity === 1) {
			priceElement.innerHTML = "";
			priceElement.appendChild(
				elementBuilder({
					type: "span",
					text: formatNumber(price, { currency: true }),
				}),
			);
		} else {
			quantityElement.textContent = `${newQuantity}x = `;
			findElement("span:last-child", priceElement).textContent = formatNumber(price * newQuantity, { currency: true });
		}
	}
}

async function startValues() {
	if (page === "item") {
		await requireItemsLoaded();

		showItemValues(findElement(".itemsList[aria-expanded='true']"));
	}
}

export default class ItemValuesFeature extends Feature {
	constructor() {
		super("Item Values", "items");
	}

	override precondition() {
		if (!getPageStatus().access) return false;

		if (page === "displaycase") {
			const userId = location.hash.startsWith("#display/") ? parseInt(location.hash.slice(9)) || false : false;

			const details = getUserDetails();
			if (userId && !("error" in details) && userId !== details.id) return false;
		} else if (page === "bazaar") {
			const userId = parseInt(getSearchParameters().get("userId")!);

			const details = getUserDetails();
			if (userId && !("error" in details) && userId !== details.id) return false;
		} else if (page === "faction" && !isInternalFaction) return false;

		return true;
	}

	override requirements() {
		if (page === "item" && !ITEM_RESOLVER.hasFullItems()) return "No API access.";

		return true;
	}

	override isEnabled() {
		return settings.pages.items.values;
	}

	override initialise() {
		initialiseItemValues();
	}

	override async execute() {
		await startValues();
	}

	override storageKeys() {
		return ["settings.pages.items.values"];
	}

	override shouldTriggerEvents(): boolean {
		return true;
	}
}
