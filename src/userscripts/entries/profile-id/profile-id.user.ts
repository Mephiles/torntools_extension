import { FEATURE_MANAGER } from "@common/utils/context";
import ProfileIDFeature from "@features/profile-id/profile-id.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_pid", settingsManifest);

	FEATURE_MANAGER.registerFeature(new ProfileIDFeature());
})();
