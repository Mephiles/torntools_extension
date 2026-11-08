import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { requireSidebar } from "@common/utils/functions/requires.ts";
import HideIconsFeature from "@features/hide-icons/hide-icons.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_hi", settingsManifest);

	if (settings.hideIcons.length === 0) return;

	const hasSidebar = await requireSidebar().then(
		() => true,
		() => false,
	);
	if (!hasSidebar) return;

	FEATURE_MANAGER.registerFeature(new HideIconsFeature());
})();
