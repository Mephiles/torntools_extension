import { setupGymPage } from "@common/pages/gym-page.ts";
import { FEATURE_MANAGER } from "@common/utils/context";
import GymDisableStatsFeature from "@features/gym-disable-stats/gym-disable-stats.ts";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_gds");
	registerInjectorUserscriptContext();

	await setupGymPage();

	FEATURE_MANAGER.registerFeature(new GymDisableStatsFeature());
})();
