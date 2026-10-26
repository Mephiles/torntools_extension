import { setupItemPage } from "@common/pages/item-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import BookEffectFeature from "@features/book-effect/book-effect";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_be", settingsManifest);
	registerNetworkUserscriptContext();
	registerInjectorUserscriptContext();
	await ScriptItemResolver.loadItems();

	setupItemPage();

	FEATURE_MANAGER.registerFeature(new BookEffectFeature());
})();
