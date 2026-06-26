import { FEATURE_MANAGER } from "@common/utils/context";
import CityItemsFeature from "@features/city-items/city-items";
import type { Feature } from "@features/feature";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";

(async () => {
	await registerUserscriptContext("tt_ci");
	await ScriptItemResolver.loadItems().catch((cause) => console.error("TT City Items - Couldn't load items.", cause));

	const feature: Feature = new CityItemsFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
