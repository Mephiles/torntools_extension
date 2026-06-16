import { setupItemPage } from "@common/pages/item-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import { type DatabaseTorndata, setTorndata, setUserdata, torndata, userdata } from "@common/utils/data/database";
import { fetchData } from "@common/utils/functions/api-fetcher";
import type { UserV1PerksResponse } from "@common/utils/functions/api-v1.types";
import { BACKUP_CALENDAR_2026 } from "@common/utils/functions/torn";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import CandyHappyFeature from "@features/candy-happy/candy-happy";
import type { Feature } from "@features/feature";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";
import { requiresAPIKey } from "@userscripts/runtime/script-fetch";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";

(async () => {
	await registerUserscriptContext("tt_ch");
	await ScriptItemResolver.loadItems();

	const key = await requiresAPIKey();

	writeTornCalendar();
	await fetchUserPerks(key);

	setupItemPage();

	const feature: Feature = new CandyHappyFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();

async function fetchUserPerks(key: string) {
	const cached = ttCache.get("tt-user-perks");
	if (cached) {
		setUserdata({ ...userdata, ...cached });
		return;
	}

	const data = await fetchData<UserV1PerksResponse>("tornv2", {
		section: "user",
		legacySelections: ["perks"],
		key: key,
		includeKey: true,
	});

	await ttCache.set({ "tt-user-perks": data }, TO_MILLIS.DAYS);

	setUserdata({ ...userdata, ...data });
}

function writeTornCalendar() {
	setTorndata({
		...(torndata ?? ({} as DatabaseTorndata)),
		calendar: BACKUP_CALENDAR_2026.calendar,
	});
}
