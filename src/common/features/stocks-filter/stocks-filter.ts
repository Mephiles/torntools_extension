import "./stocks-filter.css";
import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { filters, settings, stockdata, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { createFilter, type DuoCheckboxState, duoCheckboxesSection, type FilterController, textSection } from "@common/utils/functions/filters";
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
				const acronym = (stock?.acronym ?? row.querySelector<HTMLElement>(".tt-acronym")?.dataset.acronym)?.toLowerCase();
				const names = name.split(",");
				return names.some((n) => row.querySelector(`li[class*="stockName___"][aria-label*="${n}" i]`) || acronym?.includes(n.toLowerCase()));
			},
		}),

		duoCheckboxesSection({
			key: "investment",
			title: "Investment",
			items: ["Owned", "Benefit", "Passive", "Collection Ready"],
			defaults: filters.stocks.investment,
			test: (row, inv) => {
				if (inv.owned === "yes" || inv.owned === "no") {
					const isOwned = row.querySelector("p[class*='count___']").textContent !== "None";
					if ((isOwned && inv.owned === "no") || (!isOwned && inv.owned === "yes")) return false;
				}
				if (inv.benefit === "yes" || inv.benefit === "no") {
					const hasBenefit = !!row.querySelector(".increment.filled");
					if ((hasBenefit && inv.benefit === "no") || (!hasBenefit && inv.benefit === "yes")) return false;
				}
				if (inv.passive === "yes" || inv.passive === "no") {
					const isPassive = !!row.querySelector("[class*='dividendInfo___'] [class*='passive___']");
					if ((isPassive && inv.passive === "no") || (!isPassive && inv.passive === "yes")) return false;
				}
				if (inv.collectionReady === "yes" || inv.collectionReady === "no") {
					const isReady = !!row.querySelector("[class*='active___'][class*='Ready___']");
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
					const isUp = !!row.querySelector("[class*='changePrice___'] [class*='up___']");
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

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.stocks.filter;
	}

	async initialise() {
		await initialiseListeners();
	}

	async execute() {
		await addFilterContainer();
	}

	cleanup() {
		filter?.dispose();
	}

	storageKeys() {
		return ["settings.pages.stocks.filter"];
	}
}
