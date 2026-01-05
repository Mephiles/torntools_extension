(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Stocks Filter",
		"stocks",
		() => settings.pages.stocks.filter,
		initialiseFilters,
		addFilters,
		removeFilters,
		{
			storage: ["settings.pages.stocks.filter"],
		},
		null
	);

	async function initialiseFilters() {
		new MutationObserver((mutations) => {
			if (!feature.enabled()) return;

			// Stock ticks always update several attributes at once.
			if (mutations.length < 3) return;

			applyFilter();
		}).observe(await requireElement("#stockmarketroot [class*='stockMarket___']"), { subtree: true, attributes: true, attributeFilter: ["aria-label"] });
	}

	let localFilters: any;

	async function addFilters() {
		const stockMarketRoot = await requireElement("#stockmarketroot");

		localFilters = {};

		const { content } = createContainer("Stocks Filter", {
			class: "mt10 mb10",
			previousElement: stockMarketRoot.firstElementChild,
			compact: true,
			filter: true,
		});

		const statistics = createStatistics("stocks");
		content.appendChild(statistics.element);
		localFilters.statistics = { updateStatistics: statistics.updateStatistics };

		const filterContent = document.newElement({ type: "div", class: "content" });

		const nameFilter = createFilterSection({
			title: "Name",
			text: true,
			default: filters.stocks.name,
			callback: applyFilter,
		});
		filterContent.appendChild(nameFilter.element);
		localFilters.name = { getValue: nameFilter.getValue };

		const ownedFilter = createCheckboxDuo({ description: "Owned" });
		ownedFilter.onChange(applyFilter);
		ownedFilter.setValue(filters.stocks.investment.owned);
		localFilters.owned = { getValue: ownedFilter.getValue };

		const benefitFilter = createCheckboxDuo({ description: "Benefit" });
		benefitFilter.onChange(applyFilter);
		benefitFilter.setValue(filters.stocks.investment.benefit);
		localFilters.benefit = { getValue: benefitFilter.getValue };

		const passiveFilter = createCheckboxDuo({ description: "Passive" });
		passiveFilter.onChange(applyFilter);
		passiveFilter.setValue(filters.stocks.investment.passive);
		localFilters.passive = { getValue: passiveFilter.getValue };

		const investmentSection = createFilterSection({ title: "Investment" });
		investmentSection.element.appendChild(ownedFilter.element);
		investmentSection.element.appendChild(benefitFilter.element);
		investmentSection.element.appendChild(passiveFilter.element);
		filterContent.appendChild(investmentSection.element);

		const priceSection = createFilterSection({ title: "Price" });

		const priceFilter = createCheckboxDuo({ description: "Price", indicator: "icon" });
		priceFilter.onChange(applyFilter);
		priceFilter.setValue(filters.stocks.price.price);
		priceSection.element.appendChild(priceFilter.element);
		localFilters.price = { getValue: priceFilter.getValue };

		if (hasAPIData()) {
			const profitFilter = createCheckboxDuo({ description: "Profit" });
			profitFilter.onChange(applyFilter);
			profitFilter.setValue(filters.stocks.price.profit);
			localFilters.profit = { getValue: profitFilter.getValue };
			priceSection.element.appendChild(profitFilter.element);
		} else {
			localFilters.profit = { getValue: () => "both" };
		}

		filterContent.appendChild(priceSection.element);

		content.appendChild(filterContent);

		await applyFilter();
	}

	async function applyFilter() {
		await requireElement("#stockmarketroot ul[class*='stock___']");

		const content = findContainer("Stocks Filter", { selector: "main" });

		const name: string = localFilters.name.getValue();
		const owned: SpecialFilterValue = localFilters.owned.getValue();
		const benefit: SpecialFilterValue = localFilters.benefit.getValue();
		const passive: SpecialFilterValue = localFilters.passive.getValue();
		const price: SpecialFilterValue = localFilters.price.getValue();
		const profit: SpecialFilterValue = localFilters.profit.getValue();

		// Save filters
		await ttStorage.change({ filters: { stocks: { name, investment: { owned, benefit, passive }, price: { price, profit } } } });

		// Actual Filtering
		for (const row of document.findAll("#stockmarketroot ul[class*='stock___']")) {
			const id = parseInt(row.getAttribute("id"));

			// Name
			const acronym = row.find(".tt-acronym")?.dataset.acronym?.toLowerCase();
			if (
				name &&
				!name
					.split(",")
					.some((name) => row.find(`li[class*="stockName___"][aria-label*="${name}" i]`) || (acronym && acronym.includes(name.toLowerCase())))
			) {
				hideRow(row);
				continue;
			}

			if (owned === "yes" || owned === "no") {
				const isOwned = row.find("p[class*='count___']").textContent !== "None";

				if ((isOwned && owned === "no") || (!isOwned && owned === "yes")) {
					hideRow(row);
					continue;
				}
			}

			if (benefit === "yes" || benefit === "no") {
				const hasBenefit = !!row.find(".increment.filled");

				if ((hasBenefit && benefit === "no") || (!hasBenefit && benefit === "yes")) {
					hideRow(row);
					continue;
				}
			}

			if (passive === "yes" || passive === "no") {
				const isPassive = !!row.find("[class*='dividendInfo___'] [class*='passive___']");

				if ((isPassive && passive === "no") || (!isPassive && passive === "yes")) {
					hideRow(row);
					continue;
				}
			}

			if (price === "yes" || price === "no") {
				const isUp = !!row.find("[class*='changePrice___'] [class*='up___']");

				if ((isUp && price === "no") || (!isUp && price === "yes")) {
					hideRow(row);
					continue;
				}
			}

			if (hasAPIData() && settings.apiUsage.user.stocks && (profit === "yes" || profit === "no")) {
				if (!(id in userdata.stocks)) {
					hideRow(row);
					continue;
				}

				if (typeof stockdata[id] === "number") {
					continue;
				}

				const currentPrice = stockdata[id].current_price * userdata.stocks[id].total_shares;
				const boughtPrice = Object.values(userdata.stocks[id].transactions)
					.map((transaction) => transaction.shares * transaction.bought_price)
					.totalSum();

				const hasProfit = currentPrice > boughtPrice;

				if ((hasProfit && profit === "no") || (!hasProfit && profit === "yes")) {
					hideRow(row);
					continue;
				}
			}

			showRow(row);
		}

		function showRow(li: HTMLElement) {
			li.classList.remove("tt-hidden");
		}

		function hideRow(li: HTMLElement) {
			li.classList.add("tt-hidden");
		}

		localFilters.statistics.updateStatistics(
			document.findAll("#stockmarketroot ul[class*='stock___']:not(.tt-hidden)").length,
			document.findAll("#stockmarketroot ul[class*='stock___']").length,
			content
		);
	}

	function removeFilters() {
		localFilters = undefined;

		removeContainer("Stocks Filter");
		document.findAll("#stockmarketroot ul[class*='stock___'].tt-hidden").forEach((stock) => stock.classList.remove("tt-hidden"));
	}
})();
