import { setupUserlistPage } from "@common/pages/userlist-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import UserlistFilterFeature from "@features/userlist-filter/userlist-filter";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_ulf");
	registerInjectorUserscriptContext();

	setupUserlistPage();

	FEATURE_MANAGER.registerFeature(new UserlistFilterFeature());
})();
