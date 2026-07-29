import { FEATURE_MANAGER } from "@common/utils/context";
import AbroadPeopleFilterFeature from "@features/abroad-people-filter/abroad-people-filter";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_fmf");
	registerInjectorUserscriptContext();

	FEATURE_MANAGER.registerFeature(new AbroadPeopleFilterFeature());
})();
