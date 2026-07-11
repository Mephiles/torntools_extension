import { FEATURE_MANAGER } from "@common/utils/context";
import type { Feature } from "@features/feature";
import RacingFilterFeature from "@features/racing-filter/racing-filter";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_rf");
	registerInjectorUserscriptContext();

	const feature: Feature = new RacingFilterFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
