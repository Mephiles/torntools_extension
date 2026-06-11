import { setupFactionsPage } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import ArmoryFilterFeature from "@features/armory-filter/armory-filter";
import type { Feature } from "@features/feature";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";
import { ScriptStaticItemResolver } from "@userscripts/runtime/script-static-data-resolver";

(async () => {
	await registerUserscriptContext("tt_af");
	await ScriptStaticItemResolver.loadStaticItems();

	await setupFactionsPage();

	const feature: Feature = new ArmoryFilterFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
