import { FEATURE_MANAGER } from "@common/utils/context";
import BlackjackStrategyFeature from "@features/blackjack-strategy/blackjack-strategy";
import type { Feature } from "@features/feature";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";

(async () => {
	registerCoreUserscriptContext();
	registerInjectorUserscriptContext();

	const feature: Feature = new BlackjackStrategyFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
