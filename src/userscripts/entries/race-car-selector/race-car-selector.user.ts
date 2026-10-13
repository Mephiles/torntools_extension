import { setupRacingPage } from "@common/pages/racing-page.ts";
import { FEATURE_MANAGER } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import { setUserdata, userdata } from "@common/utils/data/database";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import RaceCarSelectorFeature from "@features/race-car-selector/race-car-selector";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { requiresAPIKey } from "@userscripts/runtime/script-fetch";
import type { UserEnlistedCarsResponse } from "tornapi-typescript";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_rcs");
	registerNetworkUserscriptContext();
	registerInjectorUserscriptContext();

	const key = await requiresAPIKey();
	await fetchEnlistedCars(key);

	setupRacingPage();
	FEATURE_MANAGER.registerFeature(new RaceCarSelectorFeature());
})();

async function fetchEnlistedCars(key: string) {
	const cached = ttCache.get<UserEnlistedCarsResponse>("tt-enlisted-cars");
	if (cached) {
		setUserdata({ ...userdata, ...cached });
		return;
	}

	const data = await fetchData<UserEnlistedCarsResponse>("tornv2", {
		section: "user",
		selections: ["enlistedcars"],
		key,
		includeKey: true,
	});

	ttCache.set({ "tt-enlisted-cars": data }, TO_MILLIS.MINUTES * 5);
	setUserdata({ ...userdata, ...data });
}
