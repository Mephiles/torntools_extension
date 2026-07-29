import { FEATURE_MANAGER } from "@common/utils/context";
import EffectiveBattleStatsFeature from "@features/effective-battle-stats/effective-battle-stats";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_ebs");

	FEATURE_MANAGER.registerFeature(new EffectiveBattleStatsFeature());
})();
