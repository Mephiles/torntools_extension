import { FEATURE_MANAGER } from "@common/utils/context";
import EnemyFilterFeature from "@features/enemy-filter/enemy-filter";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_ef", settingsManifest);

	FEATURE_MANAGER.registerFeature(new EnemyFilterFeature());
})();
