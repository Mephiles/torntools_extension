import { setupFactionsPage } from "@common/pages/factions-page";
import { setupItemPage } from "@common/pages/item-page";
import { setupTradePage } from "@common/pages/trade-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { getPage } from "@common/utils/functions/torn";
import type { Feature } from "@features/feature";
import ItemValuesFeature from "@features/item-values/item-values";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";

(async () => {
	await registerUserscriptContext("tt_iv");
	await ScriptItemResolver.loadItems();

	await setupActivePage();

	const feature: Feature = new ItemValuesFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();

async function setupActivePage() {
	switch (getPage()) {
		case "factions":
			await setupFactionsPage();
			return;
		case "item":
			setupItemPage();
			return;
		case "trade":
			setupTradePage();
			return;
	}
}
