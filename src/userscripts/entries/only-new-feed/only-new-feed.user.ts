import { FEATURE_MANAGER } from "@common/utils/context";
import type { Feature } from "@features/feature";
import OnlyNewFeedFeature from "@features/only-new-feed/only-new-feed";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";

(async () => {
	await registerUserscriptContext("tt_onf");

	const feature: Feature = new OnlyNewFeedFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
