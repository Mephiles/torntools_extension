import { setupCompanyPage } from "@common/pages/company-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import JobSpecialsFeature from "@features/job-specials/job-specials";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_js");

	setupCompanyPage();

	FEATURE_MANAGER.registerFeature(new JobSpecialsFeature());
})();
