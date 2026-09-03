import { markTravelTableColumns } from "@common/pages/travel-abroad-page";
import { FEATURE_MANAGER, ITEM_RESOLVER } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import { elementBuilder, mobile } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { convertToNumber, formatNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus, isAbroad, TAX_RATES } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import styles from "./travel-item-profits.module.css";

const SALES_TAX = TAX_RATES.salesTaxPercentage;
const ANONYMOUS_TAX = TAX_RATES.sellAnonymouslyPercentage;

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.TRAVEL_ABROAD__SHOP_LOAD, async () => {
		if (!FEATURE_MANAGER.isEnabled(TravelItemProfitsFeature)) return;

		await addProfitsColumn();
	});
	addCustomListener(EVENT_CHANNELS.TRAVEL_ABROAD__SHOP_REFRESH, async () => {
		if (!FEATURE_MANAGER.isEnabled(TravelItemProfitsFeature)) return;

		await addProfitsColumn();
	});
}

async function addProfitsColumn() {
	await requireElement("[class*='stockTableWrapper___']");
	void markTravelTableColumns();

	document.body.classList.add(styles.travelProfits);
	const market = findElement("#travel-root");
	for (const headings of findAllElements("[class*='stockTableWrapper__'] [class*='itemsHeader__']", market)) {
		if (!findElement(`.${styles.travelMarketHeading}`, headings, true)) {
			const profitHeading = elementBuilder({
				type: "div",
				text: "Profit",
				class: `${styles.travelMarketHeading} tt-title-${settings.themes.containers}`,
				dataset: {
					ttContentType: "profit",
				},
			});
			headings.insertBefore(profitHeading, findElement("[class*='tabletColC__']", headings, true));
		}
		await requireElement("[class*='stockTableWrapper___'] > li");
		const rows = findAllElements("[class*='stockTableWrapper___'] > li:not(:has([data-tt-content-type='profit']))");

		const applySalesTax = filters.abroadItems.taxes.includes("salestax");
		const sellAnonymously = filters.abroadItems.taxes.includes("anonymous");

		for (const row of rows) {
			const imageElement = findElement<HTMLImageElement>("[data-tt-content-type='item'] img", row, true);
			if (!imageElement) continue;

			const id = convertToNumber(imageElement.srcset.split(" ")[0]);

			const resolvedItem = ITEM_RESOLVER.getFullItem(id);
			if (!resolvedItem) continue;

			const marketPrice = resolvedItem.value.market_price;
			const buyPrice = convertToNumber(findElement("[data-tt-content-type='type'] + div [class*='neededSpace___']", row).textContent);

			const salesTax = applySalesTax ? Math.ceil((marketPrice * SALES_TAX) / 100) : 0;
			const anonymousTax = sellAnonymously ? Math.ceil((marketPrice * ANONYMOUS_TAX) / 100) : 0;

			const profit = Math.round(marketPrice - (buyPrice + salesTax + anonymousTax));

			const span = elementBuilder({
				type: "span",
				class: styles.travelMarketCell,
				dataset: {
					ttValue: profit.toString(),
					ttContentType: "profit",
				},
			});
			const innerSpan = elementBuilder({
				type: "span",
				text: `${profit < 0 ? "-$" : "+$"}${formatNumber(Math.abs(profit), mobile ? { shorten: 3, decimals: 1 } : {})}`,
			});

			span.classList.remove("tt-color-green", "tt-color-red");
			if (profit > 0) span.classList.add("tt-color-green");
			else if (profit < 0) span.classList.add("tt-color-red");

			span.appendChild(innerSpan);
			findElement(":scope > div[class*='row__']", row).insertBefore(span, findElement("[data-tt-content-type='stock']", row, true));
		}
	}
}

export default class TravelItemProfitsFeature extends Feature {
	constructor() {
		super("Travel Item Profits", "travel");
	}

	override precondition() {
		return getPageStatus().access && isAbroad();
	}

	override isEnabled(): boolean {
		return settings.pages.travel.travelProfits;
	}

	override initialise() {
		initialiseListeners();
	}

	override async execute() {
		await addProfitsColumn();
	}

	override storageKeys(): string[] {
		return ["settings.pages.travel.travelProfits"];
	}

	override requirements() {
		if (!ITEM_RESOLVER.hasFullItems()) return "No API access.";

		return true;
	}

	override shouldTriggerEvents(): boolean {
		return true;
	}
}
