import { setupBountiesPage } from "@common/pages/bounties-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import BountyFilterFeature from "@features/bounty-filter/bounty-filter";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_bf", settingsManifest);

	await setupBountiesPage();

	FEATURE_MANAGER.registerFeature(new BountyFilterFeature());
})();
