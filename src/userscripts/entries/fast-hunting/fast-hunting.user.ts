import { FEATURE_MANAGER } from "@common/utils/context";
import FastHuntingFeature from "@features/fast-hunting/fast-hunting.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";

(async () => {
	registerCoreUserscriptContext();

	FEATURE_MANAGER.registerFeature(new FastHuntingFeature());
})();
