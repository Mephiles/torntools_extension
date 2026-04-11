import { ExecutionTiming, FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { fetchData } from "@/utils/common/functions/api";
import { addCustomListener, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { getPageStatus, isAbroad } from "@/utils/common/functions/torn";
import { TO_MILLIS } from "@/utils/common/functions/utilities";

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
		return ["settings.pages.travel.table", "settings.external.yata", "settings.external.prometheus"];
	}

	requirements() {
		if (!settings.external.yata && !settings.external.prometheus) return "YATA and Prometheus not enabled";

		return true;
	}
}
