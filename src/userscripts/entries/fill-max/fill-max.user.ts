import { setupItemMarketPage } from "@common/pages/itemmarket-page.ts";
import { setupTravelAbroadPage } from "@common/pages/travel-abroad-page.ts";
import { FEATURE_MANAGER } from "@common/utils/context";
import { getPage, isAbroad } from "@common/utils/functions/torn.ts";
import BazaarFillMaxFeature from "@features/fill-max/bazaar-fill-max.ts";
import ItemMarketFillMaxFeature from "@features/fill-max/item-market-fill-max.ts";
import ShopsFillMaxFeature from "@features/fill-max/shops-fill-max.ts";
import TravelFillMaxFeature from "@features/fill-max/travel-fill-max.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context.ts";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_fm");
	registerInjectorUserscriptContext();

	const page = getPage();
	switch (page) {
		case "itemmarket": {
			await setupItemMarketPage();
			FEATURE_MANAGER.registerFeature(new ItemMarketFillMaxFeature());
			break;
		}
		case "bazaar": {
			FEATURE_MANAGER.registerFeature(new BazaarFillMaxFeature());
			break;
		}
		case "bigalgunshop":
		case "shops":
			FEATURE_MANAGER.registerFeature(new ShopsFillMaxFeature());
			break;
		case "travel":
			if (isAbroad()) {
				await setupTravelAbroadPage();
				FEATURE_MANAGER.registerFeature(new TravelFillMaxFeature());
			}
			break;
	}
})();
