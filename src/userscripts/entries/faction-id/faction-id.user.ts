import { setupFactionsPage } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import FactionIDFeature from "@features/faction-id/faction-id.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_fi");
	registerInjectorUserscriptContext();

	await setupFactionsPage();

	FEATURE_MANAGER.registerFeature(new FactionIDFeature());
})();
