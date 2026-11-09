import { setupFactionsPage } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import ClickableBalancesFeature from "@features/clickable-balances/clickable-balances";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_cb", settingsManifest);
	registerInjectorUserscriptContext();

	await setupFactionsPage();

	FEATURE_MANAGER.registerFeature(new ClickableBalancesFeature());
})();
