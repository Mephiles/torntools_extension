import { FEATURE_MANAGER } from "@common/utils/context";
import type { Feature } from "@features/feature";
import FriendFilterFeature from "@features/friend-filter/friend-filter";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_ff");

	const feature: Feature = new FriendFilterFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
