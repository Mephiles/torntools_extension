import { setupBountiesPage } from "@common/pages/bounties-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import BountyFilterFeature from "@features/bounty-filter/bounty-filter";
import type { Feature } from "@features/feature";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";

(async () => {
	await registerUserscriptContext("tt_bf");

	await setupBountiesPage();

	const feature: Feature = new BountyFilterFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
