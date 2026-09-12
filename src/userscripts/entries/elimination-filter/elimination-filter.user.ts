import { setupEliminationPage } from "@common/pages/elimination-page.ts";
import { FEATURE_MANAGER } from "@common/utils/context";
import EliminationFilterFeature from "@features/elimination-filter/elimination-filter.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_ef2");
	registerInjectorUserscriptContext();

	setupEliminationPage();

	FEATURE_MANAGER.registerFeature(new EliminationFilterFeature());
})();
