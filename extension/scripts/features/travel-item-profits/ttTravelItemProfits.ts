(async () => {
	if (!getPageStatus().access) return;
	if (!isAbroad()) return;

	const SALES_TAX = TAX_RATES.salesTaxPercentage;
	const ANONYMOUS_TAX = TAX_RATES.sellAnonymouslyPercentage;

	const feature = featureManager.registerFeature(
		"Travel Item Profits",
		"travel",
		() => settings.pages.travel.travelProfits,
		initialiseListeners,
		addProfitsColumn,
		removeProfitsColumn,
		{
			storage: ["settings.pages.travel.travelProfits"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";

			return true;
		}
	);

	function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.TRAVEL_ABROAD__SHOP_LOAD].push(() => {
			if (!feature.enabled()) return;

			addProfitsColumn();
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.TRAVEL_ABROAD__SHOP_REFRESH].push(() => {
			if (!feature.enabled()) return;

			addProfitsColumn();
		});
	}

	async function addProfitsColumn() {
		await requireElement("[class*='stockTableWrapper___']");
		markTravelTableColumns();

		document.body.classList.add("tt-travel-profits");
		const market = document.find("#travel-root");
		for (const headings of findAllElements("[class*='stockTableWrapper__'] [class*='itemsHeader__']", market)) {
			if (!headings.find(".tt-travel-market-heading")) {
				const profitHeading = elementBuilder({
					type: "div",
					text: "Profit",
					class: `tt-travel-market-heading tt-title-${settings.themes.containers}`,
					dataset: {
						ttContentType: "profit",
					},
				});
				headings.insertBefore(profitHeading, headings.find("[class*='tabletColC__']"));
			}
			await requireElement("[class*='stockTableWrapper___'] > li");
			const rows = findAllElements("[class*='stockTableWrapper___'] > li:not(:has([data-tt-content-type='profit']))");

			const applySalesTax = filters.abroadItems.taxes.includes("salestax");
			const sellAnonymously = filters.abroadItems.taxes.includes("anonymous");

			for (const row of rows) {
				const imageElement = row.find<HTMLImageElement>("[data-tt-content-type='item'] img");
				if (!imageElement) continue;

				const id = imageElement.srcset.split(" ")[0].getNumber();
				const marketPrice = torndata.items[id].market_value;
				const buyPrice = row.find("[data-tt-content-type='type'] + div [class*='neededSpace___']").textContent.getNumber();

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
				row.find(":scope > div[class*='row__']").insertBefore(span, row.find("[data-tt-content-type='stock']"));
			}
		}
	}

	function removeProfitsColumn() {
		document.documentElement.classList.remove("tt-travel-profits");
		document.find(".travel-agency-market.tt-travel-profits-table")?.classList.remove("tt-travel-profits-table");
		findAllElements(".tt-travel-market-heading, .tt-travel-market-cell").forEach((x) => x.remove());
	}
})();
