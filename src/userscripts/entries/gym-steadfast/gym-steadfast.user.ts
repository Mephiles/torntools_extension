import { setupGymPage } from "@common/pages/gym-page.ts";
import { FEATURE_MANAGER } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import { setUserdata, userdata } from "@common/utils/data/database";
import { fetchData } from "@common/utils/functions/api-fetcher";
import type { UserV1PerksResponse } from "@common/utils/functions/api-v1.types";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import GymSteadfastFeature from "@features/gym-steadfast/gym-steadfast.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { requiresAPIKey } from "@userscripts/runtime/script-fetch";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_gs");
	registerNetworkUserscriptContext();
	registerInjectorUserscriptContext();

	const key = await requiresAPIKey();

	await Promise.all([fetchUserPerks(key), setupGymPage()]);

	FEATURE_MANAGER.registerFeature(new GymSteadfastFeature());
})();

async function fetchUserPerks(key: string) {
	const cached = ttCache.get("tt-user-perks");
	if (cached) {
		setUserdata({ ...userdata, ...cached });
		return;
	}

	const data = await fetchData<UserV1PerksResponse>("tornv2", {
		section: "user",
		legacySelections: ["perks"],
		key: key,
		includeKey: true,
	});

	ttCache.set({ "tt-user-perks": data }, TO_MILLIS.DAYS);

	setUserdata({ ...userdata, ...data });
}
