import { setupTravelHomePage } from "@common/pages/travel-home-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { isAbroad, isFlying } from "@common/utils/functions/torn";
import FlyingTimeFeature from "@features/flying-time/flying-time";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_ft", settingsManifest);

	if (isFlying() || isAbroad()) return;

	await setupTravelHomePage();

	FEATURE_MANAGER.registerFeature(new FlyingTimeFeature());
})();
