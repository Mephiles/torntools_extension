import { FEATURE_MANAGER } from "@common/utils/context";
import RacingFilterFeature from "@features/racing-filter/racing-filter";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_rf");
	registerInjectorUserscriptContext();

	FEATURE_MANAGER.registerFeature(new RacingFilterFeature());
})();
