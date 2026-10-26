import { FEATURE_MANAGER } from "@common/utils/context";
import AbroadPeopleFilterFeature from "@features/abroad-people-filter/abroad-people-filter";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_fmf", settingsManifest);
	registerInjectorUserscriptContext();

	FEATURE_MANAGER.registerFeature(new AbroadPeopleFilterFeature());
})();
