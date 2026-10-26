import { FEATURE_MANAGER } from "@common/utils/context";
import FastHuntingFeature from "@features/fast-hunting/fast-hunting.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_fh", settingsManifest);

	FEATURE_MANAGER.registerFeature(new FastHuntingFeature());
})();
