import { FEATURE_MANAGER } from "@common/utils/context";
import type { Feature } from "@features/feature";
import LandingTimeFeature from "@features/landing-time/landing-time";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";

(async () => {
	await registerUserscriptContext("tt_lt");

	const feature: Feature = new LandingTimeFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
