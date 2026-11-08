import { FEATURE_MANAGER } from "@common/utils/context";
import AlignLeftFeature from "@features/align-left/align-left";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	// Skip waiting on this one as it's not critical in this case and helps with visual flashing.
	void registerDatabaseUserscriptContext("tt_al", settingsManifest);

	FEATURE_MANAGER.registerFeature(new AlignLeftFeature());
})();
