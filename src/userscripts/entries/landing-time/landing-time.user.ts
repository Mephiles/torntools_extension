import { FEATURE_MANAGER } from "@common/utils/context";
import type { Feature } from "@features/feature";
import LandingTimeFeature from "@features/landing-time/landing-time";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";

(async () => {
	registerCoreUserscriptContext();

	const feature: Feature = new LandingTimeFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
