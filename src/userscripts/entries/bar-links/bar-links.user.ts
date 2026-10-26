import { FEATURE_MANAGER } from "@common/utils/context";
import { checkDevice } from "@common/utils/functions/dom.ts";
import BarLinksFeature from "@features/bar-links/bar-links.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	const { hasSidebar } = await checkDevice();
	if (!hasSidebar) return;

	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_bl", settingsManifest);

	FEATURE_MANAGER.registerFeature(new BarLinksFeature());
})();
