import { FEATURE_MANAGER } from "@common/utils/context";
import type { Feature } from "@features/feature";
import RacingFilterFeature from "@features/racing-filter/racing-filter";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";

(async () => {
	await registerUserscriptContext("tt_rf");

	const feature: Feature = new RacingFilterFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
