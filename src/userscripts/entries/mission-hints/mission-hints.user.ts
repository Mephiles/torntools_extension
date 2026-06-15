import { setupMissionsPage } from "@common/pages/missions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import type { Feature } from "@features/feature";
import MissionHintsFeature from "@features/mission-hints/mission-hints";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";

(async () => {
	await registerUserscriptContext("tt_mh");

	setupMissionsPage();

	const feature: Feature = new MissionHintsFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
