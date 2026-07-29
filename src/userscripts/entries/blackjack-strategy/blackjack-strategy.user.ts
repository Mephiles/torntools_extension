import { FEATURE_MANAGER } from "@common/utils/context";
import BlackjackStrategyFeature from "@features/blackjack-strategy/blackjack-strategy";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";

(async () => {
	registerCoreUserscriptContext();
	registerInjectorUserscriptContext();

	FEATURE_MANAGER.registerFeature(new BlackjackStrategyFeature());
})();
