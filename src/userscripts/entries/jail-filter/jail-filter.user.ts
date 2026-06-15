import { setupJailPage } from "@common/pages/jail-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import type { Feature } from "@features/feature";
import JailFilterFeature from "@features/jail-filter/jail-filter";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";

(async () => {
	await registerUserscriptContext("tt_jf");

	setupJailPage();

	const feature: Feature = new JailFilterFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
