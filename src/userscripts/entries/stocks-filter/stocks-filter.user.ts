import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import { setStockdata, setUserdata, stockdata, userdata } from "@common/utils/data/database";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import StocksFilterFeature from "@features/stocks-filter/stocks-filter";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { requiresAPIKey } from "@userscripts/runtime/script-fetch";
import type { TornStocksResponse, UserStocksResponse } from "tornapi-typescript";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_sf2");
	registerNetworkUserscriptContext();

	const key = await requiresAPIKey();
	await Promise.all([fetchUserStocks(key), fetchTornStocks(key)]);

	await ttStorage.change({ api: { torn: { key } } });

	const feature = new StocksFilterFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();

async function fetchUserStocks(key: string) {
	const cached = ttCache.get("tt-user-stocks");
	if (cached) {
		setUserdata({ ...userdata, ...cached });
		return;
	}

	const data = await fetchData<UserStocksResponse>("tornv2", {
		section: "user",
		selections: ["stocks"],
		key: key,
		includeKey: true,
	});

	ttCache.set({ "tt-user-stocks": data }, TO_MILLIS.MINUTES * 5);

	setUserdata({ ...userdata, ...data });
}

async function fetchTornStocks(key: string) {
	const cached = ttCache.get("tt-torn-stocks");
	if (cached && Array.isArray(cached)) {
		setStockdata({ ...stockdata, stocks: cached });
		return;
	}

	const data = (
		await fetchData<TornStocksResponse>("tornv2", {
			section: "torn",
			selections: ["stocks"],
			key: key,
			includeKey: true,
		})
	).stocks;

	ttCache.set({ "tt-torn-stocks": data }, TO_MILLIS.MINUTES * 15);

	setStockdata({ ...stockdata, stocks: data });
}
