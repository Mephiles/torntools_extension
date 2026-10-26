import { FEATURE_MANAGER } from "@common/utils/context";
import TargetFilterFeature from "@features/target-filter/target-filter";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_tf", settingsManifest);

	FEATURE_MANAGER.registerFeature(new TargetFilterFeature());
})();
