import { setupFactionsPage } from "@common/pages/factions-page.ts";
import { createOverlay } from "@common/pages/global-page.ts";
import { FEATURE_MANAGER } from "@common/utils/context.ts";
import FactionQuickItemsFeature from "@features/faction-quick-items/faction-quick-items.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context.ts";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context.ts";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context.ts";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context.ts";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_fqi");
	registerNetworkUserscriptContext();
	registerInjectorUserscriptContext();
	await ScriptItemResolver.loadItems();

	createOverlay();
	await setupFactionsPage();

	FEATURE_MANAGER.registerFeature(new FactionQuickItemsFeature());
})();
