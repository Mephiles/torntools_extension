import { setupFactionsPage } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import RankedWarFilterFeature from "@features/ranked-war-filter/ranked-war-filter";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_rwf", settingsManifest);
	registerInjectorUserscriptContext();

	await setupFactionsPage();

	FEATURE_MANAGER.registerFeature(new RankedWarFilterFeature());
})();
