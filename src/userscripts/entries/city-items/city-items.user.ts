import { FEATURE_MANAGER } from "@common/utils/context";
import { logger } from "@common/utils/functions/logger";
import CityItemsFeature from "@features/city-items/city-items";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_ci", settingsManifest);
	registerInjectorUserscriptContext();
	registerNetworkUserscriptContext();
	await ScriptItemResolver.loadItems().catch((cause) => logger.error("Couldn't load items.", cause));

	FEATURE_MANAGER.registerFeature(new CityItemsFeature());
})();
