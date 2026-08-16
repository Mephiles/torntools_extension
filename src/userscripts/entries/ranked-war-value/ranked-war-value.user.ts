import { FEATURE_MANAGER } from "@common/utils/context";
import RankedWarValueFeature from "@features/ranked-war-value/ranked-war-value.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context.ts";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_rwv");
	registerNetworkUserscriptContext();
	await ScriptItemResolver.loadItems();

	FEATURE_MANAGER.registerFeature(new RankedWarValueFeature());
})();
