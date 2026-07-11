import { setupJailPage } from "@common/pages/jail-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import type { Feature } from "@features/feature";
import JailFilterFeature from "@features/jail-filter/jail-filter";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_jf");

	setupJailPage();

	const feature: Feature = new JailFilterFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
