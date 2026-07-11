import { setupAuctionHousePage } from "@common/pages/auction-house-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import AuctionHouseFilterFeature from "@features/auction-house-filter/auction-house-filter";
import type { Feature } from "@features/feature";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_ahf");
	registerNetworkUserscriptContext();
	registerInjectorUserscriptContext();
	await ScriptItemResolver.loadItems();

	await setupAuctionHousePage();

	const feature: Feature = new AuctionHouseFilterFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
