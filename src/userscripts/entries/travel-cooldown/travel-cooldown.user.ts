import { setupTravelHomePage } from "@common/pages/travel-home-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import { setTorndata, setUserdata, torndata, userdata } from "@common/utils/data/database";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { isAbroad, isFlying } from "@common/utils/functions/torn";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import type { Feature } from "@features/feature";
import TravelCooldownsFeature from "@features/travel-cooldowns/travel-cooldowns";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { requiresAPIKey } from "@userscripts/runtime/script-fetch";
import type { TornEducationResponse, UserBarsResponse, UserCooldownsResponse, UserEducationResponse, UserMoneyResponse } from "tornapi-typescript";

(async () => {
	if (isFlying() || isAbroad()) return;

	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_tc");
	registerNetworkUserscriptContext();
	registerInjectorUserscriptContext();

	const key = await requiresAPIKey();

	await Promise.all([fetchUserdataData(key), fetchTornEducation(key), setupTravelHomePage()]);

	const feature: Feature = new TravelCooldownsFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();

async function fetchUserdataData(key: string) {
	const cached = ttCache.get("tt-travel-cooldown");
	if (cached) {
		setUserdata({ ...userdata, ...cached });
		return;
	}

	const data = await fetchData<UserBarsResponse & UserCooldownsResponse & UserEducationResponse & UserMoneyResponse>("tornv2", {
		section: "user",
		selections: ["bars", "cooldowns", "education", "money"],
		key: key,
		includeKey: true,
	});

	ttCache.set({ "tt-travel-cooldown": data }, TO_MILLIS.MINUTES);

	setUserdata({ ...userdata, ...data });
}

async function fetchTornEducation(key: string) {
	const cached = ttCache.get("tt-torn-education");
	if (cached) {
		setTorndata({ ...torndata, education: cached });
		return;
	}

	const data = (
		await fetchData<TornEducationResponse>("tornv2", {
			section: "torn",
			selections: ["education"],
			key: key,
			includeKey: true,
		})
	).education;

	ttCache.set({ "tt-torn-education": data }, TO_MILLIS.DAYS);

	setTorndata({ ...torndata, education: data });
}
