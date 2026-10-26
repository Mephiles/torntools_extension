import { FEATURE_MANAGER } from "@common/utils/context";
import ShopFiltersFeature from "@features/shop-filters/shop-filters";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_sf", settingsManifest);
	registerNetworkUserscriptContext();
	await ScriptItemResolver.loadItems();

	FEATURE_MANAGER.registerFeature(new ShopFiltersFeature());
})();
