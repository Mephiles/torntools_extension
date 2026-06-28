import "./travel-item-profits.css";
import { markTravelTableColumns } from "@common/pages/travel-abroad-page";
import { FEATURE_MANAGER, ITEM_RESOLVER } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import { elementBuilder, findAllElements } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { convertToNumber, formatNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus, isAbroad, TAX_RATES } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

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

	document.body.classList.add("tt-travel-profits");
	const market = document.querySelector("#travel-root");
	for (const headings of findAllElements("[class*='stockTableWrapper__'] [class*='itemsHeader__']", market)) {
		if (!headings.querySelector(".tt-travel-market-heading")) {
			const profitHeading = elementBuilder({
				type: "div",
				text: "Profit",
				class: `tt-travel-market-heading tt-title-${settings.themes.containers}`,
				dataset: {
					ttContentType: "profit",
				},
			});
			headings.insertBefore(profitHeading, headings.querySelector("[class*='tabletColC__']"));
		}
		await requireElement("[class*='stockTableWrapper___'] > li");
		const rows = findAllElements("[class*='stockTableWrapper___'] > li:not(:has([data-tt-content-type='profit']))");

		const applySalesTax = filters.abroadItems.taxes.includes("salestax");
		const sellAnonymously = filters.abroadItems.taxes.includes("anonymous");

		for (const row of rows) {
			const imageElement = row.querySelector<HTMLImageElement>("[data-tt-content-type='item'] img");
			if (!imageElement) continue;

			const id = convertToNumber(imageElement.srcset.split(" ")[0]);
			const marketPrice = ITEM_RESOLVER.getFullItem(id).value.market_price;
			const buyPrice = convertToNumber(row.querySelector("[data-tt-content-type='type'] + div [class*='neededSpace___']").textContent);

			const salesTax = applySalesTax ? Math.ceil((marketPrice * SALES_TAX) / 100) : 0;
			const anonymousTax = sellAnonymously ? Math.ceil((marketPrice * ANONYMOUS_TAX) / 100) : 0;

			const profit = Math.round(marketPrice - (buyPrice + salesTax + anonymousTax));

			const span = elementBuilder({
				type: "span",
				class: "tt-travel-market-cell",
				dataset: {
					ttValue: profit.toString(),
					ttContentType: "profit",
				},
			});
			const innerSpan = elementBuilder({
				type: "span",
				text: `${profit < 0 ? "-$" : "+$"}${formatNumber(Math.abs(profit))}`,
			});

			span.classList.remove("tt-color-green", "tt-color-red");
			if (profit > 0) span.classList.add("tt-color-green");
			else if (profit < 0) span.classList.add("tt-color-red");

			span.appendChild(innerSpan);
			row.querySelector(":scope > div[class*='row__']").insertBefore(span, row.querySelector("[data-tt-content-type='stock']"));
		}
	}
}

function removeProfitsColumn() {
	document.documentElement.classList.remove("tt-travel-profits");
	document.querySelector(".travel-agency-market.tt-travel-profits-table")?.classList.remove("tt-travel-profits-table");
	findAllElements(".tt-travel-market-heading, .tt-travel-market-cell").forEach((x) => x.remove());
}

export default class TravelItemProfitsFeature extends Feature {
	constructor() {
		super("Travel Item Profits", "travel");
	}

	precondition() {
		return getPageStatus().access && isAbroad();
	}

	isEnabled(): boolean {
		return settings.pages.travel.travelProfits;
	}

	initialise() {
		initialiseListeners();
	}

	async execute() {
		await addProfitsColumn();
	}

	cleanup() {
		removeProfitsColumn();
	}

	storageKeys(): string[] {
		return ["settings.pages.travel.travelProfits"];
	}

	requirements() {
		if (!ITEM_RESOLVER.hasFullItems()) return "No API access.";

		return true;
	}
}
