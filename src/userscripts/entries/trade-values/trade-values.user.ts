import { setupTradePage } from "@common/pages/trade-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import type { Feature } from "@features/feature";
import TradeValuesFeature from "@features/trade-values/trade-values";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";

(async () => {
	await registerUserscriptContext("tt_tv");
	await ScriptItemResolver.loadItems();

	setupTradePage();

	const feature: Feature = new TradeValuesFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
