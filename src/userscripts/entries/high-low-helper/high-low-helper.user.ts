import { FEATURE_MANAGER } from "@common/utils/context";
import type { Feature } from "@features/feature";
import HighLowHelperFeature from "@features/high-low-helper/high-low-helper";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_hlh");
	registerInjectorUserscriptContext();

	const feature: Feature = new HighLowHelperFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
