import { setupFactionsPage } from "@common/pages/factions-page";
import { setupItemPage } from "@common/pages/item-page";
import { setupTradePage } from "@common/pages/trade-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { getPage } from "@common/utils/functions/torn";
import ItemValuesFeature from "@features/item-values/item-values";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_iv");
	registerNetworkUserscriptContext();
	registerInjectorUserscriptContext();
	await ScriptItemResolver.loadItems();

	await setupActivePage();

	FEATURE_MANAGER.registerFeature(new ItemValuesFeature());
})();

async function setupActivePage() {
	switch (getPage()) {
		case "factions":
			await setupFactionsPage();
			return;
		case "item":
			setupItemPage();
			return;
		case "trade":
			setupTradePage();
			return;
	}
}
