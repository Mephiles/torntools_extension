import { FEATURE_MANAGER } from "@common/utils/context";
import CityItemsFeature from "@features/city-items/city-items";
import type { Feature } from "@features/feature";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_ci");
	registerInjectorUserscriptContext();
	registerNetworkUserscriptContext();
	await ScriptItemResolver.loadItems().catch((cause) => console.error("TT City Items - Couldn't load items.", cause));

	const feature: Feature = new CityItemsFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
