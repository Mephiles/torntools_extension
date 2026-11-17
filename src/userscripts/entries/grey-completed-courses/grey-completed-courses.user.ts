import { FEATURE_MANAGER } from "@common/utils/context";
import GreyCompletedCoursesFeature from "@features/grey-completed-courses/grey-completed-courses";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_gcc", settingsManifest);

	FEATURE_MANAGER.registerFeature(new GreyCompletedCoursesFeature());
})();
