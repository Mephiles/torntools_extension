import { setupFactionsPage } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import FactionMemberFilterFeature from "@features/faction-member-filter/faction-member-filter";
import type { Feature } from "@features/feature";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";

(async () => {
	await registerUserscriptContext("tt_fmf");

	const feature: Feature = new FactionMemberFilterFeature();
	await setupFactionsPage();

	FEATURE_MANAGER.registerFeature(feature);
})();
