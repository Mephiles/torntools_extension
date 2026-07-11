import { FEATURE_MANAGER } from "@common/utils/context";
import type { Feature } from "@features/feature";
import SpecialistGymsFeature from "@features/specialist-gyms/specialist-gyms";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_sg");

	const feature: Feature = new SpecialistGymsFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
