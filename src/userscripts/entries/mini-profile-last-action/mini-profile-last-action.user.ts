import { FEATURE_MANAGER } from "@common/utils/context";
import MiniProfileLastActionFeature from "@features/mini-profile-last-action/mini-profile-last-action.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_mpla");
	registerInjectorUserscriptContext();

	FEATURE_MANAGER.registerFeature(new MiniProfileLastActionFeature());
})();
