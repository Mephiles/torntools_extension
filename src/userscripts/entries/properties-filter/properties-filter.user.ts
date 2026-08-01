import { setupPropertiesPage } from "@common/pages/properties-page.ts";
import { FEATURE_MANAGER } from "@common/utils/context";
import PropertiesFilterFeature from "@features/properties-filter/properties-filter.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_pf");

	setupPropertiesPage();

	FEATURE_MANAGER.registerFeature(new PropertiesFilterFeature());
})();
