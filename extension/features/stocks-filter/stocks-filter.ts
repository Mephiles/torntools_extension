import "./stocks-filter.css";
import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { filters, settings, stockdata, userdata } from "@/utils/common/data/database";
import { ttStorage } from "@/utils/common/data/storage";
import { createCheckboxDuo } from "@/utils/common/elements/checkbox-duo/checkbox-duo";
import { hasAPIData } from "@/utils/common/functions/api";
import { createContainer, findContainer, removeContainer } from "@/utils/common/functions/containers";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { createFilterEnabledFunnel, createFilterSection, createStatistics, type SpecialFilterValue } from "@/utils/common/functions/filters";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus } from "@/utils/common/functions/torn";

async function initialiseFilters() {
	new MutationObserver((mutations) => {
		if (!FEATURE_MANAGER.isEnabled(StocksFilterFeature)) return;

		// Stock ticks always update several attributes at once.
		if (mutations.length < 3) return;

		applyFilter();
	}).observe(await requireElement("#stockmarketroot [class*='stockMarket___']"), { subtree: true, attributes: true, attributeFilter: ["aria-label"] });
}

let localFilters: any;

async function addFilters() {
	const stockMarketRoot = await requireElement("#stockmarketroot");

	localFilters = {};

	const { content, options } = createContainer("Stocks Filter", {
		class: "mt10 mb10",
		previousElement: stockMarketRoot.firstElementChild,
		compact: true,
		filter: true,
	});

	const statistics = createStatistics("stocks");
	content.appendChild(statistics.element);
	localFilters.statistics = { updateStatistics: statistics.updateStatistics };

	const filterContent = elementBuilder({ type: "div", class: "content" });

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

	const enabledFunnel = createFilterEnabledFunnel();
	enabledFunnel.onChange(applyFilter);
	enabledFunnel.setEnabled(filters.stocks.enabled);
	options.appendChild(enabledFunnel.element);
	localFilters.enabled = { isEnabled: enabledFunnel.isEnabled };

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
	await ttStorage.change({
		filters: { stocks: { enabled: localFilters.enabled.isEnabled(), name, investment: { owned, benefit, passive }, price: { price, profit } } },
	});

	// Actual Filtering
	if (!localFilters.enabled.isEnabled()) {
		findAllElements("#stockmarketroot ul[class*='stock___'].tt-hidden").forEach((stock) => stock.classList.remove("tt-hidden"));
		localFilters.statistics.updateStatistics(
			findAllElements("#stockmarketroot ul[class*='stock___']:not(.tt-hidden)").length,
			findAllElements("#stockmarketroot ul[class*='stock___']").length,
			content,
		);
		return;
	}

	for (const row of findAllElements("#stockmarketroot ul[class*='stock___']")) {
		const id = parseInt(row.getAttribute("id"));

		// Name
		const acronym = row.querySelector<HTMLElement>(".tt-acronym")?.dataset.acronym?.toLowerCase();
		if (
			name &&
			!name.split(",").some((name) => row.querySelector(`li[class*="stockName___"][aria-label*="${name}" i]`) || acronym?.includes(name.toLowerCase()))
		) {
			hideRow(row);
			continue;
		}

		if (owned === "yes" || owned === "no") {
			const isOwned = row.querySelector("p[class*='count___']").textContent !== "None";

			if ((isOwned && owned === "no") || (!isOwned && owned === "yes")) {
				hideRow(row);
				continue;
			}
		}

		if (benefit === "yes" || benefit === "no") {
			const hasBenefit = !!row.querySelector(".increment.filled");

			if ((hasBenefit && benefit === "no") || (!hasBenefit && benefit === "yes")) {
				hideRow(row);
				continue;
			}
		}

		if (passive === "yes" || passive === "no") {
			const isPassive = !!row.querySelector("[class*='dividendInfo___'] [class*='passive___']");

			if ((isPassive && passive === "no") || (!isPassive && passive === "yes")) {
				hideRow(row);
				continue;
			}
		}

		if (price === "yes" || price === "no") {
			const isUp = !!row.querySelector("[class*='changePrice___'] [class*='up___']");

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

			const userStock = userdata.stocks.find((stock) => stock.id === id);
			const currentPrice = stockdata[id].current_price * userStock.shares;
			const boughtPrice = userStock.transactions.map((transaction) => transaction.shares * transaction.price).reduce((a, b) => a + b, 0);

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
		findAllElements("#stockmarketroot ul[class*='stock___']:not(.tt-hidden)").length,
		findAllElements("#stockmarketroot ul[class*='stock___']").length,
		content,
	);
}

function removeFilters() {
	localFilters = undefined;

	removeContainer("Stocks Filter");
	findAllElements("#stockmarketroot ul[class*='stock___'].tt-hidden").forEach((stock) => stock.classList.remove("tt-hidden"));
}

export default class StocksFilterFeature extends Feature {
	constructor() {
		super("Stocks Filter", "stocks");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.stocks.filter;
	}

	async initialise() {
		await initialiseFilters();
	}

	async execute() {
		await addFilters();
	}

	cleanup() {
		removeFilters();
	}

	storageKeys() {
		return ["settings.pages.stocks.filter"];
	}
}
