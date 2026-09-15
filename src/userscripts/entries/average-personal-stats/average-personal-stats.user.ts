import { FEATURE_MANAGER } from "@common/utils/context";
import AveragePersonalStatFeature from "@features/average-personal-stat/average-personal-stat.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";

(async () => {
	registerCoreUserscriptContext();
	registerInjectorUserscriptContext();

	FEATURE_MANAGER.registerFeature(new AveragePersonalStatFeature());
})();
