import { setupCompanyPage } from "@common/pages/company-page.ts";
import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import CompanyIDFeature from "@features/company-id/company-id.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { requiresAPIKey } from "@userscripts/runtime/script-fetch.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_ci");
	registerNetworkUserscriptContext();
	registerInjectorUserscriptContext();

	await requiresAPIKey();
	await ttStorage.change({ userdata: { date: Date.now() } });

	setupCompanyPage();

	FEATURE_MANAGER.registerFeature(new CompanyIDFeature());
})();
