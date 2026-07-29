import { setupFactionsPage } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import ArmoryFilterFeature from "@features/armory-filter/armory-filter";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_af");
	registerNetworkUserscriptContext();
	registerInjectorUserscriptContext();
	await ScriptItemResolver.loadItems();

	await setupFactionsPage();

	FEATURE_MANAGER.registerFeature(new ArmoryFilterFeature());
})();
