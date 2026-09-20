import { FEATURE_MANAGER } from "@common/utils/context";
import CostToNextStockFeature from "@features/cost-to-next-stock/cost-to-next-stock.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_ctns");
	registerNetworkUserscriptContext();

	FEATURE_MANAGER.registerFeature(new CostToNextStockFeature());
})();
