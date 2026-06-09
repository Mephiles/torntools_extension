import { FEATURE_MANAGER } from "@common/utils/context";
import AbroadPeopleFilterFeature from "@features/abroad-people-filter/abroad-people-filter";
import type { Feature } from "@features/feature";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";

(async () => {
	await registerUserscriptContext("tt_fmf");

	const feature: Feature = new AbroadPeopleFilterFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();
