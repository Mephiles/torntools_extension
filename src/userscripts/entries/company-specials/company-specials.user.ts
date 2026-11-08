import { FEATURE_MANAGER } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import { api, setUserdata, userdata } from "@common/utils/data/database";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { logger } from "@common/utils/functions/logger";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import CompanySpecialsFeature from "@features/company-specials/company-specials";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { optionalAPIKey } from "@userscripts/runtime/script-fetch.ts";
import type { UserMeritsResponse } from "tornapi-typescript";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_cs", settingsManifest);
	registerNetworkUserscriptContext();
	registerInjectorUserscriptContext();

	optionalAPIKey();

	await loadMerits();

	FEATURE_MANAGER.registerFeature(new CompanySpecialsFeature());
})();

async function loadMerits() {
	if (!api.torn.key) return;

	const cached = ttCache.get("tt-user-merits");
	if (cached) {
		setUserdata({ ...userdata, ...cached });
		return;
	}

	try {
		const data = await fetchData<UserMeritsResponse>("tornv2", { section: "user", selections: ["merits"] });

		ttCache.set({ "tt-user-merits": data }, TO_MILLIS.DAYS);
		setUserdata({ ...userdata, ...data });
	} catch (error) {
		logger.error("Couldn't load your merits, so the mug range will not be adjusted.", error);
	}
}
