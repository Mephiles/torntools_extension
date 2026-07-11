import { setupHospitalPage } from "@common/pages/hospital-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import type { Feature } from "@features/feature";
import HospitalFilterFeature from "@features/hospital-filter/hospital-filter";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_fmf");

	setupHospitalPage();

	const feature: Feature = new HospitalFilterFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
