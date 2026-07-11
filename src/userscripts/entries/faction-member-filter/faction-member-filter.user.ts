import { setupFactionsPage } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import FactionMemberFilterFeature from "@features/faction-member-filter/faction-member-filter";
import type { Feature } from "@features/feature";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_fmf");
	registerInjectorUserscriptContext();

	await setupFactionsPage();

	const feature: Feature = new FactionMemberFilterFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
