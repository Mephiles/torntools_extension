import { FEATURE_MANAGER } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import { setUserdata, userdata } from "@common/utils/data/database";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import type { Feature } from "@features/feature";
import WeaponExperienceFeature from "@features/weapon-experience/weapon-experience";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { requiresAPIKey } from "@userscripts/runtime/script-fetch";
import type { UserWeaponExpResponse } from "tornapi-typescript";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_we");
	registerNetworkUserscriptContext();

	const key = await requiresAPIKey();

	await fetchWeaponExperienceData(key);

	const feature: Feature = new WeaponExperienceFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();

async function fetchWeaponExperienceData(key: string) {
	const cachedWeaponExperience = ttCache.get("tt-weapon-experience");
	if (cachedWeaponExperience) {
		setUserdata({ ...userdata, weaponexp: cachedWeaponExperience });
		return;
	}

	const data = await fetchData<UserWeaponExpResponse>("tornv2", {
		section: "user",
		selections: ["weaponexp"],
		key: key,
		includeKey: true,
	});

	ttCache.set({ "tt-weapon-experience": data.weaponexp }, TO_MILLIS.MINUTES * 15);

	setUserdata({ ...userdata, ...data });
}
