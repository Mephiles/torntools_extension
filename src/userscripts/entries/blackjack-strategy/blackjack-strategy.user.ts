import { FEATURE_MANAGER } from "@common/utils/context";
import BlackjackStrategyFeature from "@features/blackjack-strategy/blackjack-strategy";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_bs", settingsManifest);
	registerInjectorUserscriptContext();

	FEATURE_MANAGER.registerFeature(new BlackjackStrategyFeature());
})();
