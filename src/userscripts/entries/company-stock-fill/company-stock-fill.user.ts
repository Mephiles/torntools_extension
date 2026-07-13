import { setupCompanyPage } from "@common/pages/company-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import AutoStockFillFeature from "@features/auto-stock-fill/auto-stock-fill";
import type { Feature } from "@features/feature";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";

(() => {
	registerCoreUserscriptContext();
	registerInjectorUserscriptContext();

	setupCompanyPage();

	const feature: Feature = new AutoStockFillFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
