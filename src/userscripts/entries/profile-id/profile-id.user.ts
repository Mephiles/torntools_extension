import { FEATURE_MANAGER } from "@common/utils/context";
import ProfileIDFeature from "@features/profile-id/profile-id.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";

(async () => {
	registerCoreUserscriptContext();

	FEATURE_MANAGER.registerFeature(new ProfileIDFeature());
})();
