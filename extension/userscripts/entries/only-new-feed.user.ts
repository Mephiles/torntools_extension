import type { Feature } from "@/features/feature-manager";
import OnlyNewFeedFeature from "@/features/only-new-feed/only-new-feed";
import { registerUserscriptContext } from "@/userscripts/runtime/script-context";
import { FEATURE_MANAGER } from "@/utils/context";

(async () => {
	await registerUserscriptContext();

	const feature: Feature = new OnlyNewFeedFeature();

	FEATURE_MANAGER.registerFeature(feature);
})();
