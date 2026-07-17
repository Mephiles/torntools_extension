import { ttStorage } from "@common/utils/context";
import { settings, stockdata } from "@common/utils/data/database";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { formatNumber } from "@common/utils/functions/formatting";
import { LINKS } from "@common/utils/functions/torn";
import type { TornStocksResponse } from "tornapi-typescript";
import { dispatchNotification } from "../notifications";

type FetchedStockdata = TornStocksResponse;

export async function updateStocks() {
	const oldStocks = [...(stockdata?.stocks ?? [])];
	const stocks = (await fetchData<FetchedStockdata>("tornv2", { section: "torn", selections: ["stocks"] })).stocks;
	if (!stocks?.length) throw new Error("Aborted updating due to an unexpected response.");

	await ttStorage.change({ stockdata: { stocks, date: Date.now() } });

	if (oldStocks.length && settings.notifications.types.global) {
		for (const _id in settings.notifications.types.stocks) {
			const id = parseInt(_id);
			const oldStock = oldStocks.find((s) => s.id === id);
			if (!oldStock) continue;

			const newStock = stocks.find((s) => s.id === id);
			if (!newStock) continue;

			const alerts = settings.notifications.types.stocks[id];

			if (alerts.priceFalls && oldStock.market.price > alerts.priceFalls && newStock.market.price <= alerts.priceFalls) {
				const message = `(${newStock.acronym}) ${newStock.name} has fallen to ${formatNumber(newStock.market.price, {
					currency: true,
				})} (alert: ${formatNumber(alerts.priceFalls, { currency: true })})!`;

				await dispatchNotification({
					title: "TornTools -  Stock Alerts",
					message,
					url: LINKS.stocks,
					date: Date.now(),
				});
			} else if (alerts.priceReaches && oldStock.market.price < alerts.priceReaches && newStock.market.price >= alerts.priceReaches) {
				const message = `(${newStock.acronym}) ${newStock.name} has reached ${formatNumber(newStock.market.price, {
					currency: true,
				})} (alert: ${formatNumber(alerts.priceReaches, { currency: true })})!`;

				await dispatchNotification({
					title: "TornTools -  Stock Alerts",
					message,
					url: LINKS.stocks,
					date: Date.now(),
				});
			}
		}
	}
}
