import { setupCompanyPage } from "@common/pages/company-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import CompanyStockFillFeature from "@features/company-stock-fill/company-stock-fill";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_csf", settingsManifest);

	setupCompanyPage();

	FEATURE_MANAGER.registerFeature(new CompanyStockFillFeature());
})();
