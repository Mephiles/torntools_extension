import { FEATURE_MANAGER } from "@common/utils/context";
import TargetFilterFeature from "@features/target-filter/target-filter";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_tf");

	FEATURE_MANAGER.registerFeature(new TargetFilterFeature());
})();
