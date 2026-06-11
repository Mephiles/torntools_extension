import { FEATURE_MANAGER } from "@common/utils/context";
import type { Feature } from "@features/feature";
import ShopFiltersFeature from "@features/shop-filters/shop-filters";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";

(async () => {
	await registerUserscriptContext("tt_sf");
	await ScriptItemResolver.loadItems();

	const feature: Feature = new ShopFiltersFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
