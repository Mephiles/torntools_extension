import { FEATURE_MANAGER } from "@common/utils/context";
import CrimeValueFeature from "@features/crime-value/crime-value.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_cv", settingsManifest);
	registerInjectorUserscriptContext();
	registerNetworkUserscriptContext();
	await ScriptItemResolver.loadItems();

	FEATURE_MANAGER.registerFeature(new CrimeValueFeature());
})();
