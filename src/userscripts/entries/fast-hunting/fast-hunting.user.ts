import { FEATURE_MANAGER } from "@common/utils/context";
import FastHuntingFeature from "@features/fast-hunting/fast-hunting.ts";
import type { Feature } from "@features/feature";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";

(async () => {
	registerCoreUserscriptContext();

	const feature: Feature = new FastHuntingFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
