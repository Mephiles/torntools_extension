import { setupHospitalPage } from "@common/pages/hospital-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import HospitalFilterFeature from "@features/hospital-filter/hospital-filter";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_fmf", settingsManifest);

	setupHospitalPage();

	FEATURE_MANAGER.registerFeature(new HospitalFilterFeature());
})();
