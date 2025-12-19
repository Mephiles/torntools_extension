(async () => {
	if (!getPageStatus().access) return;
	if (!isAbroad()) return;

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
		for (const headings of market.findAll("[class*='stockTableWrapper__'] [class*='itemsHeader__']")) {
			markTravelTableColumns();
			if (!headings.find(".tt-travel-market-heading")) {
				const profitHeading = document.newElement({
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
			const rows = document.findAll("[class*='stockTableWrapper___'] > li:not(:has([data-tt-content-type='profit']))");
			for (const row of rows) {
				const id = row.find("[data-tt-content-type='item'] img").getAttribute("srcset").split(" ")[0].getNumber();
				const marketPrice = parseInt(torndata.items[id].market_value);
				const buyPrice = row.find("[data-tt-content-type='type'] + div [class*='displayPrice__']").textContent.getNumber();
				const profit = marketPrice - buyPrice;

				const span = document.newElement({
					type: "span",
					class: "tt-travel-market-cell",
					dataset: {
						ttValue: profit.toString(),
						ttContentType: "profit",
					},
				});
				const innerSpan = document.newElement({
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
		document.findAll(".tt-travel-market-heading, .tt-travel-market-cell").forEach((x) => x.remove());
	}
})();
