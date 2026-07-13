import { setupCompanyPage } from "@common/pages/company-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import CompanyStockFillFeature from "@features/company-stock-fill/company-stock-fill";
import type { Feature } from "@features/feature";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";

(() => {
	registerCoreUserscriptContext();

	setupCompanyPage();

	const feature: Feature = new CompanyStockFillFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
