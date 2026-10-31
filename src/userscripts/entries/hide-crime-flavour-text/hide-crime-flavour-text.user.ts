import { setupCrimesV2Page } from "@common/pages/crimes2-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import HideCrimeFlavourTextFeature from "@features/hide-crime-flavour-text/hide-crime-flavour-text.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_hcft", settingsManifest);
	registerInjectorUserscriptContext();

	setupCrimesV2Page();

	FEATURE_MANAGER.registerFeature(new HideCrimeFlavourTextFeature());
})();
