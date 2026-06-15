import { setupUserlistPage } from "@common/pages/userlist-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import type { Feature } from "@features/feature";
import UserlistFilterFeature from "@features/userlist-filter/userlist-filter";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";

(async () => {
	await registerUserscriptContext("tt_ulf");

	setupUserlistPage();

	const feature: Feature = new UserlistFilterFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
