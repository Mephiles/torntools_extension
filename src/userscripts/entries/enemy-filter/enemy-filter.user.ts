import { FEATURE_MANAGER } from "@common/utils/context";
import EnemyFilterFeature from "@features/enemy-filter/enemy-filter";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_ef");

	FEATURE_MANAGER.registerFeature(new EnemyFilterFeature());
})();
