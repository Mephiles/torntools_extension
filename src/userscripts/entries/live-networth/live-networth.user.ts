import { FEATURE_MANAGER } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import { setUserdata, userdata } from "@common/utils/data/database";
import { fetchData } from "@common/utils/functions/api-fetcher";
import type { UserV1NetworthResponse } from "@common/utils/functions/api-v1.types";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import type { Feature } from "@features/feature";
import LiveNetworthFeature from "@features/live-networth/live-networth";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { requiresAPIKey } from "@userscripts/runtime/script-fetch";
import type { UserPersonalStatsFull } from "tornapi-typescript";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_we");
	registerNetworkUserscriptContext();

	const key = await requiresAPIKey();

	await fetchLiveNetworthData(key);

	const feature: Feature = new LiveNetworthFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();

async function fetchLiveNetworthData(key: string) {
	const cachedPersonalStats = ttCache.get("tt-personalstats");
	const cachedNetworth = ttCache.get("tt-networth");
	const cachedLiveNetworthDate = ttCache.get("tt-live-networth-update");
	if (cachedPersonalStats && cachedNetworth) {
		setUserdata({ ...userdata, networth: cachedNetworth, personalstats: cachedPersonalStats, date: cachedLiveNetworthDate });
		return;
	}

	const data = await fetchData<UserPersonalStatsFull & UserV1NetworthResponse>("tornv2", {
		section: "user",
		selections: ["personalstats"],
		legacySelections: ["networth"],
		key: key,
		params: {
			cat: "all",
		},
		includeKey: true,
	});
	const date = Date.now();

	ttCache.set({ "tt-personalstats": data.personalstats }, TO_MILLIS.HOURS);
	ttCache.set({ "tt-networth": data.networth }, TO_MILLIS.MINUTES * 30);
	ttCache.setIndefinite({ "tt-live-networth-update": date });

	setUserdata({ ...userdata, ...data, date });
}
