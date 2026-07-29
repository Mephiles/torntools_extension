import { FEATURE_MANAGER } from "@common/utils/context";
import FriendFilterFeature from "@features/friend-filter/friend-filter";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_ff");

	FEATURE_MANAGER.registerFeature(new FriendFilterFeature());
})();
