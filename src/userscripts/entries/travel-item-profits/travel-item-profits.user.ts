import { setupTravelAbroadPage } from "@common/pages/travel-abroad-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { isAbroad } from "@common/utils/functions/torn";
import type { Feature } from "@features/feature";
import TravelItemProfitsFeature from "@features/travel-item-profits/travel-item-profits";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";

(async () => {
	if (!isAbroad()) return;

	await registerUserscriptContext("tt_tip");
	await ScriptItemResolver.loadItems();

	await setupTravelAbroadPage();

	const feature: Feature = new TravelItemProfitsFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
