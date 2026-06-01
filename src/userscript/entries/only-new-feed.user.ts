import type { Feature } from "@features/feature";
import OnlyNewFeedFeature from "@features/only-new-feed/only-new-feed";
import { registerUserscriptContext } from "@userscript/runtime/script-context";
import { FEATURE_MANAGER } from "@utils/context";

(async () => {
	await registerUserscriptContext();

	const feature: Feature = new OnlyNewFeedFeature();

	FEATURE_MANAGER.registerFeature(feature);
})();
