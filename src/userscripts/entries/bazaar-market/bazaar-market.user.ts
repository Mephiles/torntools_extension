import { setupItemMarketPage } from "@common/pages/itemmarket-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import BazaarMarketFeature from "@features/bazaar-market/bazaar-market.svelte.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_bm");
	registerNetworkUserscriptContext();
	registerInjectorUserscriptContext();
	await ScriptItemResolver.loadItems();

	await setupItemMarketPage();

	FEATURE_MANAGER.registerFeature(new BazaarMarketFeature());
})();
