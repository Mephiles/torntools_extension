import { FEATURE_MANAGER } from "@common/utils/context";
import AveragePersonalStatFeature from "@features/average-personal-stat/average-personal-stat.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_aps", settingsManifest);
	registerInjectorUserscriptContext();

	FEATURE_MANAGER.registerFeature(new AveragePersonalStatFeature());
})();
