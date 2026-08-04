import { FEATURE_MANAGER } from "@common/utils/context";
import { checkDevice } from "@common/utils/functions/dom.ts";
import BarLinksFeature from "@features/bar-links/bar-links.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";

(async () => {
	const { hasSidebar } = await checkDevice();
	if (!hasSidebar) return;

	registerCoreUserscriptContext();

	FEATURE_MANAGER.registerFeature(new BarLinksFeature());
})();
