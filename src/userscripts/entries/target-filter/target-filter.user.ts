import { FEATURE_MANAGER } from "@common/utils/context";
import type { Feature } from "@features/feature";
import TargetFilterFeature from "@features/target-filter/target-filter";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_tf");

	const feature: Feature = new TargetFilterFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
