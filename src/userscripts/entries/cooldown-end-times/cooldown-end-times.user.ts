import { FEATURE_MANAGER } from "@common/utils/context";
import { isPageWithSidebar } from "@common/utils/functions/torn";
import CooldownEndTimesFeature from "@features/cooldown-end-times/cooldown-end-times.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_cet", settingsManifest);

	if (!isPageWithSidebar()) return;

	FEATURE_MANAGER.registerFeature(new CooldownEndTimesFeature());
})();
