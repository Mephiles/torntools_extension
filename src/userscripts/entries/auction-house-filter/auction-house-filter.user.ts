import { setupAuctionHousePage } from "@common/pages/auction-house-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import AuctionHouseFilterFeature from "@features/auction-house-filter/auction-house-filter";
import type { Feature } from "@features/feature";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";

(async () => {
	await registerUserscriptContext("tt_ahf");
	await ScriptItemResolver.loadItems();

	await setupAuctionHousePage();

	const feature: Feature = new AuctionHouseFilterFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
