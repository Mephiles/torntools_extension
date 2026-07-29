import { setupTravelAbroadPage } from "@common/pages/travel-abroad-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { isAbroad } from "@common/utils/functions/torn";
import TravelItemProfitsFeature from "@features/travel-item-profits/travel-item-profits";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";

(async () => {
	if (!isAbroad()) return;

	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_tip");
	registerInjectorUserscriptContext();
	registerNetworkUserscriptContext();
	await ScriptItemResolver.loadItems();

	await setupTravelAbroadPage();

	FEATURE_MANAGER.registerFeature(new TravelItemProfitsFeature());
})();
