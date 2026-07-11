import { setupTravelAbroadPage } from "@common/pages/travel-abroad-page";
import { setupTravelHomePage } from "@common/pages/travel-home-page";
import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { isAbroad, isFlying } from "@common/utils/functions/torn";
import TravelTableFeature from "@features/travel-table/travel-table";
import TravelSyncFeature from "@features/travel-table/travel-table-sync";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_tt");
	registerNetworkUserscriptContext();
	registerInjectorUserscriptContext();

	await ScriptItemResolver.loadItems();

	await Promise.all([
		setupActivePage(),
		ttStorage.change({
			settings: {
				external: {
					yata: !isAbroad(), // Disabling YATA for uploading data because they block unknown clients.
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
