import { FEATURE_MANAGER } from "@common/utils/context";
import type { Feature } from "@features/feature";
import SpecialistGymsFeature from "@features/specialist-gyms/specialist-gyms";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";

(async () => {
	await registerUserscriptContext("tt_sg");

	const feature: Feature = new SpecialistGymsFeature();

	FEATURE_MANAGER.registerFeature(feature);
})();
