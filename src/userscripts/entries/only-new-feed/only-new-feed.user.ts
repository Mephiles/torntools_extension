import { FEATURE_MANAGER } from "@common/utils/context";
import OnlyNewFeedFeature from "@features/only-new-feed/only-new-feed";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_onf");
	registerInjectorUserscriptContext();

	FEATURE_MANAGER.registerFeature(new OnlyNewFeedFeature());
})();
