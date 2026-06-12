import { setupTravelAbroadPage } from "@common/pages/travel-abroad-page";
import { setupTravelHomePage } from "@common/pages/travel-home-page";
import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { isAbroad, isFlying } from "@common/utils/functions/torn";
import TravelTableFeature from "@features/travel-table/travel-table";
import TravelSyncFeature from "@features/travel-table/travel-table-sync";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";

(async () => {
	await registerUserscriptContext("tt_tt");
	await ScriptItemResolver.loadItems();

	await Promise.all([
		setupActivePage(),
		ttStorage.change({
			settings: {
				external: {
					yata: !isAbroad(), // Disabling YATA because they block unknown clients.
					prometheus: true,
					tornintel: true,
				},
				pages: { travel: { autoTravelTableCountry: true } },
				apiUsage: { user: { travel: false } },
			},
		}),
	]);

	if (isAbroad()) {
		await setupTravelAbroadPage();
		FEATURE_MANAGER.registerFeature(new TravelSyncFeature());
		return;
	}

	FEATURE_MANAGER.registerFeature(new TravelTableFeature());
})();

async function setupActivePage() {
	if (isAbroad()) await setupTravelAbroadPage();
	else if (!isFlying()) await setupTravelHomePage();
}
