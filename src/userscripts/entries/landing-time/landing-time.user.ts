import { FEATURE_MANAGER } from "@common/utils/context";
import LandingTimeFeature from "@features/landing-time/landing-time";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_lt", settingsManifest);

	FEATURE_MANAGER.registerFeature(new LandingTimeFeature());
})();
