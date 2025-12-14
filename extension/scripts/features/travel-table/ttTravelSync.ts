interface SyncItem {
	id: number;
	quantity: number;
	cost: number;
}

(async () => {
	if (!isAbroad()) return;
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Travel Sync",
		"travel",
		() => settings.pages.travel.table,
		initialise,
		null,
		null,
		{
			storage: ["settings.pages.travel.table", "settings.external.yata", "settings.external.prometheus"],
		},
		() => {
			if (!settings.external.yata && !settings.external.prometheus) return "YATA and Prometheus not enabled";

			return true;
		}
	);

	let nextUpdate = 0;

	function initialise() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.TRAVEL_ABROAD__SHOP_LOAD].push(({ items, country }: TravelAbroadShopLoadDetails) => {
			if (!feature.enabled()) return;

			syncData(items, country);
		});
	}

	function syncData(items: SyncItem[], country: string) {
		if (Date.now() < nextUpdate) {
			return;
		}
		nextUpdate = Date.now() + TO_MILLIS.SECONDS * 30;

		const data = {
			client: "TornTools",
			version: chrome.runtime.getManifest().version,
			author_name: "Mephiles",
			author_id: 2087524,
			country: country.trim().slice(0, 3).toLowerCase(),
			items,
		};

		if (settings.external.yata) {
			fetchData("yata", { section: "travel/import/", method: "POST", body: data, relay: true })
				.then((response) => console.log("TT - Updated YATA abroad prices.", response))
				.catch((error) => console.warn("TT - Failed to update YATA abroad prices.", error));
		}
		if (settings.external.prometheus) {
			fetchData("prometheus", { section: "travel", method: "POST", body: data, relay: true })
				.then((response) => console.log("TT - Updated Prometheus abroad prices.", response))
				.catch((error) => console.warn("TT - Failed to update Prometheus abroad prices.", error));
		}
	}
})();
