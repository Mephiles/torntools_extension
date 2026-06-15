import { setupFactionsPage } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import type { Feature } from "@features/feature";
import RankedWarFilterFeature from "@features/ranked-war-filter/ranked-war-filter";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";

(async () => {
	await registerUserscriptContext("tt_rwf");

	await setupFactionsPage();

	const feature: Feature = new RankedWarFilterFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
