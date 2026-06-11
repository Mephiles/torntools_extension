import { setupTravelAbroadPage } from "@common/pages/travel-abroad-page";
import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { isAbroad } from "@common/utils/functions/torn";
import AbroadItemsFilterFeature from "@features/abroad-items-filter/abroad-items-filter";
import type { Feature } from "@features/feature";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";

(async () => {
	if (!isAbroad()) return;

	await registerUserscriptContext("tt_aif");

	await Promise.all([setupTravelAbroadPage(), ttStorage.change({ settings: { pages: { travel: { travelProfits: false } } } })]);

	const feature: Feature = new AbroadItemsFilterFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
