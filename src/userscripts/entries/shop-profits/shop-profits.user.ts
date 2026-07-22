import { FEATURE_MANAGER } from "@common/utils/context";
import type { Feature } from "@features/feature";
import ShopProfitsFeature from "@features/shop-profits/shop-profits";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_sp");
	registerNetworkUserscriptContext();
	await ScriptItemResolver.loadItems();

	const feature: Feature = new ShopProfitsFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
