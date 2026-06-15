import { setupFactionsPage } from "@common/pages/factions-page";
import { setupItemPage } from "@common/pages/item-page";
import { setupItemMarketPage } from "@common/pages/itemmarket-page";
import { setupTravelAbroadPage } from "@common/pages/travel-abroad-page";
import { setupTravelHomePage } from "@common/pages/travel-home-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { getPage } from "@common/utils/functions/torn";
import DrugDetailsFeature from "@features/drug-details/drug-details";
import type { Feature } from "@features/feature";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";

(async () => {
	await registerUserscriptContext("tt_dd");
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
