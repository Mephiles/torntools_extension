import { setupBountiesPage } from "@common/pages/bounties-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import BountyFilterFeature from "@features/bounty-filter/bounty-filter";
import type { Feature } from "@features/feature";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_bf");

	await setupBountiesPage();

	const feature: Feature = new BountyFilterFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
