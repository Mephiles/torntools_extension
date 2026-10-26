import { FEATURE_MANAGER } from "@common/utils/context";
import EffectiveBattleStatsFeature from "@features/effective-battle-stats/effective-battle-stats";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_ebs", settingsManifest);

	FEATURE_MANAGER.registerFeature(new EffectiveBattleStatsFeature());
})();
