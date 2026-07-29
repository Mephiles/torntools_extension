import { setupFactionsPage } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import RankedWarFilterFeature from "@features/ranked-war-filter/ranked-war-filter";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_rwf");
	registerInjectorUserscriptContext();

	await setupFactionsPage();

	FEATURE_MANAGER.registerFeature(new RankedWarFilterFeature());
})();
