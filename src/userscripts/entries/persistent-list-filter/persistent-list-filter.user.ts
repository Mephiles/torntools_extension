import { FEATURE_MANAGER } from "@common/utils/context";
import PersistentListFilterFeature from "@features/persistent-list-filter/persistent-list-filter";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { applySettingsDefaults } from "@userscripts/settings/shared-settings";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();

	// On by default for this script, but the settings stay user-configurable (they are not overrides).
	await applySettingsDefaults({
		pages: { friends: { nativeFilter: true }, enemies: { nativeFilter: true }, targets: { nativeFilter: true } },
	});
	await registerDatabaseUserscriptContext("tt_plf", settingsManifest);

	FEATURE_MANAGER.registerFeature(new PersistentListFilterFeature());
})();
