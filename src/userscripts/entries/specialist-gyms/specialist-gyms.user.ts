import { FEATURE_MANAGER } from "@common/utils/context";
import SpecialistGymsFeature from "@features/specialist-gyms/specialist-gyms.svelte";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_sg");

	FEATURE_MANAGER.registerFeature(new SpecialistGymsFeature());
})();
