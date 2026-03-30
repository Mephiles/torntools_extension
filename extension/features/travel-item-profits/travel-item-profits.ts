import "./travel-item-profits.css";
import { getPageStatus, isAbroad, TAX_RATES } from "@/utils/common/functions/torn";
import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { filters, settings, torndata } from "@/utils/common/data/database";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";
import { markTravelTableColumns } from "@/pages/travel-abroad-page";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { convertToNumber, formatNumber } from "@/utils/common/functions/formatting";
import { hasAPIData } from "@/utils/common/functions/api";

const SALES_TAX = TAX_RATES.salesTaxPercentage;
const ANONYMOUS_TAX = TAX_RATES.sellAnonymouslyPercentage;

function initialiseListeners() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.TRAVEL_ABROAD__SHOP_LOAD].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(TravelItemProfitsFeature)) return;

		await addProfitsColumn();
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.TRAVEL_ABROAD__SHOP_REFRESH].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(TravelItemProfitsFeature)) return;

		await addProfitsColumn();
	});
}

async function addProfitsColumn() {
	await requireElement("[class*='stockTableWrapper___']");
	markTravelTableColumns();

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
			const marketPrice = torndata.itemsMap[id].value.market_price;
			const buyPrice = convertToNumber(row.querySelector("[data-tt-content-type='type'] + div [class*='neededSpace___']").textContent);

			const salesTax = applySalesTax ? Math.ceil((marketPrice * SALES_TAX) / 100) : 0;
			const anonymousTax = sellAnonymously ? Math.ceil((marketPrice * ANONYMOUS_TAX) / 100) : 0;

			const profit = marketPrice - (buyPrice + salesTax + anonymousTax);

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
			if (buyPrice > marketPrice) span.classList.add("tt-color-red");
			else if (buyPrice < marketPrice) span.classList.add("tt-color-green");

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
		if (!hasAPIData()) return "No API access.";

		return true;
	}
}
