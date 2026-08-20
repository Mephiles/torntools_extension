import { FEATURE_MANAGER } from "@common/utils/context";
import StocksMoneyInputFeature from "@features/stocks-money-input/stocks-money-input.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_smi");
	registerNetworkUserscriptContext();

	FEATURE_MANAGER.registerFeature(new StocksMoneyInputFeature());
})();
