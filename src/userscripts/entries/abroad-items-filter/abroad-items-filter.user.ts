import { setupTravelAbroadPage } from "@common/pages/travel-abroad-page";
import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { isAbroad } from "@common/utils/functions/torn";
import AbroadItemsFilterFeature from "@features/abroad-items-filter/abroad-items-filter";
import type { Feature } from "@features/feature";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";

(async () => {
	if (!isAbroad()) return;

	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_aif");
	registerInjectorUserscriptContext();

	await Promise.all([setupTravelAbroadPage(), ttStorage.change({ settings: { pages: { travel: { travelProfits: false } } } })]);

	const feature: Feature = new AbroadItemsFilterFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
