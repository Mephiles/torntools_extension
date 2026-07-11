import { FEATURE_MANAGER } from "@common/utils/context";
import EffectiveBattleStatsFeature from "@features/effective-battle-stats/effective-battle-stats";
import type { Feature } from "@features/feature";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_ebs");

	const feature: Feature = new EffectiveBattleStatsFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
