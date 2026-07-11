import { FEATURE_MANAGER } from "@common/utils/context";
import EffectiveBattleStatsFeature from "@features/effective-battle-stats/effective-battle-stats";
import type { Feature } from "@features/feature";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";

(async () => {
	await registerUserscriptContext("tt_ebs");

	const feature: Feature = new EffectiveBattleStatsFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
