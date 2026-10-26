import { FEATURE_MANAGER } from "@common/utils/context";
import OnlyNewFeedFeature from "@features/only-new-feed/only-new-feed";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_onf", settingsManifest);
	registerInjectorUserscriptContext();

	FEATURE_MANAGER.registerFeature(new OnlyNewFeedFeature());
})();
