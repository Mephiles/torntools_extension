import { setupFactionsPage } from "@common/pages/factions-page";
import { setupItemPage } from "@common/pages/item-page";
import { setupItemMarketPage } from "@common/pages/itemmarket-page";
import { setupTravelAbroadPage } from "@common/pages/travel-abroad-page";
import { setupTravelHomePage } from "@common/pages/travel-home-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { getPage } from "@common/utils/functions/torn";
import DrugDetailsFeature from "@features/drug-details/drug-details";
import type { Feature } from "@features/feature";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_dd");
	registerNetworkUserscriptContext();
	registerInjectorUserscriptContext();
	await ScriptItemResolver.loadItems();

	await setupActivePage();

	const feature: Feature = new DrugDetailsFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();

async function setupActivePage() {
	switch (getPage()) {
		case "factions":
			await setupFactionsPage();
			return;
		case "item":
			setupItemPage();
			return;
		case "itemmarket":
			await setupItemMarketPage();
			return;
		case "travel":
			await Promise.all([setupTravelAbroadPage(), setupTravelHomePage()]);
			return;
	}
}
