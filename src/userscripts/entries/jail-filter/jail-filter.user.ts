import { setupJailPage } from "@common/pages/jail-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import JailFilterFeature from "@features/jail-filter/jail-filter";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_jf", settingsManifest);

	setupJailPage();

	FEATURE_MANAGER.registerFeature(new JailFilterFeature());
})();
