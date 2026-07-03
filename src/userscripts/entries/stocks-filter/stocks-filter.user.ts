import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import { setStockdata, setUserdata, stockdata, userdata } from "@common/utils/data/database";
import { fetchData } from "@common/utils/functions/api-fetcher";
import type { TornV1StocksResponse } from "@common/utils/functions/api-v1.types";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import StocksFilterFeature from "@features/stocks-filter/stocks-filter";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";
import { requiresAPIKey } from "@userscripts/runtime/script-fetch";
import type { UserStocksResponse } from "tornapi-typescript";

(async () => {
	await registerUserscriptContext("tt_sf2");

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
	if (cached) {
		setStockdata({ ...stockdata, ...cached });
		return;
	}

	const data = (
		await fetchData<TornV1StocksResponse>("tornv2", {
			section: "torn",
			legacySelections: ["stocks"],
			key: key,
			includeKey: true,
		})
	).stocks;

	ttCache.set({ "tt-torn-stocks": data }, TO_MILLIS.MINUTES * 15);

	setStockdata({ ...stockdata, ...data });
}
