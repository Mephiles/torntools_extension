import { FEATURE_MANAGER } from "@common/utils/context";
import type { Feature } from "@features/feature";
import OpenedSupplyPackValueFeature from "@features/opened-supply-pack-value/opened-supply-pack-value";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_ospv");
	registerInjectorUserscriptContext();
	registerNetworkUserscriptContext();
	await ScriptItemResolver.loadItems();

	const feature: Feature = new OpenedSupplyPackValueFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
