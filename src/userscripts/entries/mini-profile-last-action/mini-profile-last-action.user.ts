import { FEATURE_MANAGER } from "@common/utils/context";
import MiniProfileLastActionFeature from "@features/mini-profile-last-action/mini-profile-last-action.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context.ts";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_mpla", settingsManifest);
	registerInjectorUserscriptContext();

	FEATURE_MANAGER.registerFeature(new MiniProfileLastActionFeature());
})();
