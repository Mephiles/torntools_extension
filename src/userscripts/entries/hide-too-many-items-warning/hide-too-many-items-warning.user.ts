import { FEATURE_MANAGER } from "@common/utils/context";
import HideTooManyItemsWarningFeature from "@features/hide-too-many-items-warning/hide-too-many-items-warning";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_htmiw", settingsManifest);

	FEATURE_MANAGER.registerFeature(new HideTooManyItemsWarningFeature());
})();
