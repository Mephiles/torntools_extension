import { FEATURE_MANAGER } from "@common/utils/context";
import HideRecycleMessageFeature from "@features/hide-recycle-message/hide-recycle-message";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_hrm", settingsManifest);

	FEATURE_MANAGER.registerFeature(new HideRecycleMessageFeature());
})();
