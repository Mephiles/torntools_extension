import { setupMissionsPage } from "@common/pages/missions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import type { Feature } from "@features/feature";
import MissionHintsFeature from "@features/mission-hints/mission-hints";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";

(async () => {
	registerCoreUserscriptContext();
	registerInjectorUserscriptContext();

	setupMissionsPage();

	const feature: Feature = new MissionHintsFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
