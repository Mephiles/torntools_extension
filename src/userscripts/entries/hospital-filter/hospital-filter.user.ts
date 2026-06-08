import { setupFactionsPage } from "@common/pages/factions-page";
import { setupHospitalPage } from "@common/pages/hospital-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import FactionMemberFilterFeature from "@features/faction-member-filter/faction-member-filter";
import type { Feature } from "@features/feature";
import HospitalFilterFeature from "@features/hospital-filter/hospital-filter";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";

(async () => {
	await registerUserscriptContext("tt_fmf");

	const feature: Feature = new HospitalFilterFeature();
	await setupHospitalPage();

	FEATURE_MANAGER.registerFeature(feature);
})();
