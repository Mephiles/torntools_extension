import { settings } from "@common/utils/data/database";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/listeners";
import { getPageStatus, isAbroad } from "@common/utils/functions/torn";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import { ExecutionTiming, FEATURE_MANAGER, Feature } from "@extension/context/feature-manager";

export interface SyncItem {
	id: number;
	quantity: number;
	cost: number;
}

let nextUpdate = 0;

function initialise() {
	addCustomListener(EVENT_CHANNELS.TRAVEL_ABROAD__SHOP_LOAD, ({ items, country }) => {
		if (!FEATURE_MANAGER.isEnabled(TravelSyncFeature)) return;

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
		version: browser.runtime.getManifest().version,
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
	if (settings.external.tornintel) {
		fetchData("tornintel", { section: "foreign-stock/upload", method: "POST", body: data, relay: true })
			.then((response) => console.log("TT - Updated Torn Intel abroad prices.", response))
			.catch((error) => console.warn("TT - Failed to update Torn Intel abroad prices.", error));
	}
}

export default class TravelSyncFeature extends Feature {
	constructor() {
		super("Travel Sync", "travel", ExecutionTiming.DOM_INTERACTIVE);
	}

	precondition() {
		return isAbroad() && getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.travel.table;
	}

	initialise() {
		initialise();
	}

	storageKeys() {
		return ["settings.pages.travel.table", "settings.external.yata", "settings.external.prometheus", "settings.external.tornintel"];
	}

	requirements() {
		if (!settings.external.yata && !settings.external.prometheus && !settings.external.tornintel) return "Prometheus, Torn Intel and YATA not enabled";

		return true;
	}
}
