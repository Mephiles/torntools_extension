import { FEATURE_MANAGER } from "@common/utils/context";
import EnemyFilterFeature from "@features/enemy-filter/enemy-filter";
import type { Feature } from "@features/feature";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_ef");

	const feature: Feature = new EnemyFilterFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
