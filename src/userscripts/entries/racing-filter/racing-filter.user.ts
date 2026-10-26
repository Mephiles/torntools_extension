import { setupRacingPage } from "@common/pages/racing-page.ts";
import { FEATURE_MANAGER } from "@common/utils/context";
import RacingFilterFeature from "@features/racing-filter/racing-filter";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_rf", settingsManifest);
	registerInjectorUserscriptContext();

	setupRacingPage();

	FEATURE_MANAGER.registerFeature(new RacingFilterFeature());
})();
