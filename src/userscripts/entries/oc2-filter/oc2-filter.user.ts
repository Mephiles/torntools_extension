import { setupFactionsPage } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import type { Feature } from "@features/feature";
import OC2FilterFeature from "@features/oc2-filter/oc2-filter";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_of");
	registerInjectorUserscriptContext();

	await setupFactionsPage();

	const feature: Feature = new OC2FilterFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
