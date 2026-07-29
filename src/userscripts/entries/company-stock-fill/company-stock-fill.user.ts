import { setupCompanyPage } from "@common/pages/company-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import CompanyStockFillFeature from "@features/company-stock-fill/company-stock-fill";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";

(() => {
	registerCoreUserscriptContext();

	setupCompanyPage();

	FEATURE_MANAGER.registerFeature(new CompanyStockFillFeature());
})();
