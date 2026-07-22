import { FEATURE_MANAGER } from "@common/utils/context";
import type { Feature } from "@features/feature";
import LandingTimeFeature from "@features/landing-time/landing-time";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_lt");

	const feature: Feature = new LandingTimeFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
