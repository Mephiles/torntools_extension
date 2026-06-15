import { createOverlay } from "@common/pages/global-page";
import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import { setUserdata, userdata } from "@common/utils/data/database";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import ProfileBoxFeature from "@features/profile-box/profile-box";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";
import { requiresAPIKey } from "@userscripts/runtime/script-fetch";
import type { UserPersonalStatsFull, UserWorkStatsResponse } from "tornapi-typescript";

(async () => {
	await registerUserscriptContext("tt_pb");

	const key = await requiresAPIKey();
	await fetchProfileUserdata(key);

	createOverlay();

	await ttStorage.change({
		api: { torn: { key } },
		settings: {
			pages: {
				profile: {
					boxSpy: false,
					boxStakeout: false,
					boxAttackHistory: false,
				},
			},
		},
	});

	const feature = new ProfileBoxFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();

async function fetchProfileUserdata(key: string) {
	const cached = ttCache.get("tt-profile-box-data");
	if (cached) {
		setUserdata({ ...userdata, ...cached });
		return;
	}

	const data = await fetchData<UserWorkStatsResponse & UserPersonalStatsFull>("tornv2", {
		section: "user",
		selections: ["workstats", "personalstats"],
		key: key,
		includeKey: true,
		params: { cat: "all" },
	});

	await ttCache.set({ "tt-profile-box-data": data }, TO_MILLIS.DAYS);
	await ttCache.set({ "tt-workstats": data.workstats }, TO_MILLIS.DAYS);
	await ttCache.set({ "tt-personalstats": data.personalstats }, TO_MILLIS.DAYS);

	setUserdata({ ...userdata, ...data });
}
