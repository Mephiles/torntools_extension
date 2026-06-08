import { setupItemPage } from "@common/pages/item-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import { type DatabaseTorndata, setTorndata, setUserdata, torndata, userdata } from "@common/utils/data/database";
import { fetchData } from "@common/utils/functions/api-fetcher";
import type { UserV1PerksResponse } from "@common/utils/functions/api-v1.types";
import { BACKUP_CALENDAR_2026 } from "@common/utils/functions/torn";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import CanEnergyFeature from "@features/can-energy/can-energy";
import type { Feature } from "@features/feature";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";
import { requiresAPIKey } from "@userscripts/runtime/script-fetch";
import type { TornItem } from "tornapi-typescript";

(async () => {
	await registerUserscriptContext("tt_ce");

	const key = await requiresAPIKey();

	writeCanItems();
	await fetchCanEnergyData(key);

	setupItemPage();
	const feature: Feature = new CanEnergyFeature();

	FEATURE_MANAGER.registerFeature(feature);
})();

async function fetchCanEnergyData(key: string) {
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

function writeCanItems() {
	setTorndata({
		...(torndata ?? ({} as DatabaseTorndata)),
		calendar: BACKUP_CALENDAR_2026.calendar,
		itemsMap: {
			"530": {
				name: "Can of Munster",
				effect: "Increases energy by 20 and booster cooldown by 2 hours.",
			} as TornItem,
			"532": {
				name: "Can of Red Cow",
				effect: "Increases energy by 25 and booster cooldown by 2 hours.",
			} as TornItem,
			"533": {
				name: "Can of Taurine Elite",
				effect: "Increases energy by 30 and booster cooldown by 2 hours.",
			} as TornItem,
			"553": {
				name: "Can of Santa Shooters",
				effect: "Increases energy by 20 and booster cooldown by 2 hours.",
			} as TornItem,
			"554": {
				name: "Can of Rockstar Rudolph",
				effect: "Increases energy by 25 and booster cooldown by 2 hours.",
			} as TornItem,
			"555": {
				name: "Can of X-MASS",
				effect: "Increases energy by 30 and booster cooldown by 2 hours.",
			} as TornItem,
			"985": {
				name: "Can of Goose Juice",
				effect: "Increases energy by 5 and booster cooldown by 2 hours.",
			} as TornItem,
			"986": {
				name: "Can of Damp Valley",
				effect: "Increases energy by 10 and booster cooldown by 2 hours.",
			} as TornItem,
			"987": {
				name: "Can of Crocozade",
				effect: "Increases energy by 15 and booster cooldown by 2 hours.",
			} as TornItem,
		},
	});
}
