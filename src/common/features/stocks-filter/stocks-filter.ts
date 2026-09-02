import "./stocks-filter.css";
import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { filters, settings, stockdata, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { createFilter, duoCheckboxesSection, textSection } from "@common/utils/functions/filters";
import type { DuoCheckboxState, FilterController } from "@common/utils/functions/filters";
import { findElement } from "@common/utils/functions/find-elements";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

let filter: FilterController | undefined;

async function initialiseListeners() {
	new MutationObserver((mutations) => {
		if (!FEATURE_MANAGER.isEnabled(StocksFilterFeature)) return;

		// Stock ticks always update several attributes at once.
		if (mutations.length < 3) return;
		filter?.run();
	}).observe(await requireElement("#stockmarketroot [class*='stockMarket___']"), { subtree: true, attributes: true, attributeFilter: ["aria-label"] });
}

type StocksFilterState = {
	enabled: boolean;
	name: string;
	investment: DuoCheckboxState;
	priceGroup: DuoCheckboxState;
};

async function addFilterContainer() {
	const stockMarketRoot = await requireElement("#stockmarketroot");

	filter?.dispose();

	const sections = [
		textSection({
			key: "name",
			title: "Name",
			defaultValue: filters.stocks.name,
			test: (row, name) => {
				if (!name) return true;

				const id = parseInt(row.getAttribute("id"));
				const stock = stockdata.stocks.find((s) => s.id === id);
				const acronym = (stock?.acronym ?? findElement(".tt-acronym", row, true)?.dataset.acronym)?.toLowerCase();
				const names = name
					.split(",")
					.map((n) => n.trim())
					.filter((n) => !!n);
				return names.some((n) => findElement(`li[class*="stockName___"][aria-label*="${n}" i]`, row, true) || acronym?.includes(n.toLowerCase()));
			},
		}),

		duoCheckboxesSection({
			key: "investment",
			title: "Investment",
			items: ["Owned", "Benefit", "Passive", "Collection Ready"],
			defaults: filters.stocks.investment,
			test: (row, inv) => {
				if (inv.owned === "yes" || inv.owned === "no") {
					const isOwned = findElement("p[class*='count___']", row).textContent !== "None";
					if ((isOwned && inv.owned === "no") || (!isOwned && inv.owned === "yes")) return false;
				}
				if (inv.benefit === "yes" || inv.benefit === "no") {
					const hasBenefit = !!findElement(".increment.filled", row, true);
					if ((hasBenefit && inv.benefit === "no") || (!hasBenefit && inv.benefit === "yes")) return false;
				}
				if (inv.passive === "yes" || inv.passive === "no") {
					const isPassive = !!findElement("[class*='dividendInfo___'] [class*='passive___']", row, true);
					if ((isPassive && inv.passive === "no") || (!isPassive && inv.passive === "yes")) return false;
				}
				if (inv.collectionReady === "yes" || inv.collectionReady === "no") {
					const isReady = !!findElement("[class*='active___'][class*='Ready___']", row, true);
					if ((isReady && inv.collectionReady === "no") || (!isReady && inv.collectionReady === "yes")) return false;
				}
				return true;
			},
		}),

		duoCheckboxesSection({
			key: "priceGroup",
			title: "Price",
			items: hasAPIData() ? [{ id: "Price", indicator: "icon" }, "Profit"] : [{ id: "Price", indicator: "icon" }],
			defaults: filters.stocks.price,
			test: (row, pg) => {
				if (pg.price === "yes" || pg.price === "no") {
					const isUp = !!findElement("[class*='changePrice___'] [class*='up___']", row, true);
					if ((isUp && pg.price === "no") || (!isUp && pg.price === "yes")) return false;
				}

				if (pg.profit === "yes" || pg.profit === "no") {
					if (!hasAPIData() || !settings.apiUsage.user.stocks) return true;
					const id = parseInt(row.getAttribute("id"));
					const stock = stockdata.stocks.find((s) => s.id === id);
					if (!stock) return true;

					const userStock = userdata.stocks.find((s) => s.id === id);
					if (!userStock) return false;

					const currentPrice = stock.market.price * userStock.shares;
					const boughtPrice = userStock.transactions
						.map(({ shares, price }) => shares * price)
						.reduce((total, transactionTotal) => total + transactionTotal, 0);
					const hasProfit = currentPrice > boughtPrice;

					if ((hasProfit && pg.profit === "no") || (!hasProfit && pg.profit === "yes")) return false;
				}

				return true;
			},
		}),
	];

	filter = createFilter<StocksFilterState>({
		rowSelector: "#stockmarketroot ul[class*='stock___']",
		container: {
			title: "Stocks Filter",
			class: "mt10 mb10",
			previousElement: stockMarketRoot.firstElementChild,
			compact: true,
		},
		statisticsLabel: "stocks",
		enabled: filters.stocks.enabled,
		sections,
		onStateChange: async (state) => {
			await ttStorage.change({
				filters: {
					stocks: {
						enabled: state.enabled,
						name: state.name,
						investment: state.investment,
						price: { price: state.priceGroup.price, profit: state.priceGroup.profit ?? "both" },
					},
				},
			});
		},
	});

	await filter.run();
}

export default class StocksFilterFeature extends Feature {
	constructor() {
		super("Stocks Filter", "stocks");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.stocks.filter;
	}

	override async initialise() {
		await initialiseListeners();
	}

	override async execute() {
		await addFilterContainer();
	}

	cleanup() {
		filter?.dispose();
	}

	override storageKeys() {
		return ["settings.pages.stocks.filter"];
	}
}
