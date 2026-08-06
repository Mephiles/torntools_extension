import { setupItemPage } from "@common/pages/item-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import { type DatabaseTorndata, setTorndata, setUserdata, torndata, userdata } from "@common/utils/data/database";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { BACKUP_CALENDAR_2026 } from "@common/utils/functions/torn";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import CanEnergyFeature from "@features/can-energy/can-energy";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { requiresAPIKey } from "@userscripts/runtime/script-fetch";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";
import type { UserPerksResponse } from "tornapi-typescript";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_ce");
	registerNetworkUserscriptContext();
	registerInjectorUserscriptContext();
	await ScriptItemResolver.loadItems();

	const key = await requiresAPIKey();

	writeCanItems();
	await fetchCanEnergyData(key);

	setupItemPage();

	FEATURE_MANAGER.registerFeature(new CanEnergyFeature());
})();

async function fetchCanEnergyData(key: string) {
	const cached = ttCache.get("tt-user-perks-v2");
	if (cached) {
		setUserdata({ ...userdata, ...cached });
		return;
	}

	const data = await fetchData<UserPerksResponse>("tornv2", {
		section: "user",
		selections: ["perks"],
		key: key,
		includeKey: true,
	});

	ttCache.set({ "tt-user-perks-v2": data }, TO_MILLIS.DAYS);

	setUserdata({ ...userdata, ...data });
}

function writeCanItems() {
	setTorndata({
		...(torndata ?? ({} as DatabaseTorndata)),
		calendar: BACKUP_CALENDAR_2026.calendar,
	});
}
