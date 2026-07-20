import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import { type DatabaseUserdata, setUserdata, userdata } from "@common/utils/data/database";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import EfficientRehabFeature from "@features/efficient-rehab/efficient-rehab";
import type { Feature } from "@features/feature";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { requiresAPIKey } from "@userscripts/runtime/script-fetch";
import type { PersonalStatsDrugs } from "tornapi-typescript";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_er");
	registerNetworkUserscriptContext();
	registerInjectorUserscriptContext();

	const key = await requiresAPIKey();

	await Promise.all([fetchUserRehabAmount(key), ttStorage.change({ settings: { pages: { travel: { efficientRehabSelect: true } } } })]);

	const feature: Feature = new EfficientRehabFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();

async function fetchUserRehabAmount(key: string) {
	const cached = ttCache.get("tt-user-rehab-amount");
	if (cached) {
		setUserdata({ ...userdata, personalstats: { drugs: cached } as DatabaseUserdata["personalstats"] });
		return;
	}

	const data = await fetchData<{ personalstats: PersonalStatsDrugs }>("tornv2", {
		section: "user",
		selections: ["personalstats"],
		key: key,
		includeKey: true,
		params: {
			cat: "drugs",
		},
	});

	ttCache.set({ "tt-user-stats-drugs": data.personalstats.drugs }, TO_MILLIS.DAYS);

	setUserdata({ ...userdata, personalstats: data.personalstats as DatabaseUserdata["personalstats"] });
}
