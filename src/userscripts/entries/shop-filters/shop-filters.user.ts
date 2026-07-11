import { FEATURE_MANAGER } from "@common/utils/context";
import type { Feature } from "@features/feature";
import ShopFiltersFeature from "@features/shop-filters/shop-filters";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_sf");
	registerNetworkUserscriptContext();
	await ScriptItemResolver.loadItems();

	const feature: Feature = new ShopFiltersFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
