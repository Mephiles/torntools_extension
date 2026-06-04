import { ttStorage } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import { elementBuilder } from "@common/utils/functions/dom";
import type { ProxyService } from "@webext-core/proxy-service";
import type { BackgroundService } from "@/services/BackgroundService";

type BGService = BackgroundService | ProxyService<BackgroundService>;

export function exposeDebugObjects(backgroundService: BGService) {
	// noinspection JSUnusedGlobalSymbols
	globalThis.DebugFunctions = {
		fullDataDump,
		forceUpdateUserdata: () => backgroundService.forceUpdate("userdata"),
		forceUpdateTorndata: () => backgroundService.forceUpdate("torndata"),
		forceUpdateAll: () => forceUpdateAll(backgroundService),
		reinitializeTimers: () => backgroundService.reinitializeTimers(),
		notification: (title: string, message: string) => backgroundService.notification(title, message),
	};
	// noinspection JSUnusedGlobalSymbols
	globalThis.InternalObjects = {
		ttStorage,
		ttCache,
	};
}

function fullDataDump(reduction: boolean = true) {
	ttStorage.get().then((storage) => {
		Object.values(storage.api).forEach((x) => {
			if (!("key" in x) || !x.key) return;

			if (x.key.startsWith("TS_")) x.key = `TS_<redacted:${x.key.length - 3}>`;
			else x.key = `<redacted:${x.key.length}>`;
		});
		if (reduction) {
			if (storage.settings.notifications?.soundCustom) storage.settings.notifications.soundCustom = "<reduced:custom_sound>";
			storage.stockdata = { "<reduced>": Object.keys(storage.stockdata).length, date: storage.stockdata.date };
			// @ts-expect-error Modifying a copy of the database for debugging purposes.
			storage.torndata.education = `<reduced:${storage.torndata.education.length}>`;
			// @ts-expect-error Modifying a copy of the database for debugging purposes.
			storage.torndata.honors = `<reduced:${storage.torndata.honors.length}>`;
			// @ts-expect-error Modifying a copy of the database for debugging purposes.
			storage.torndata.medals = `<reduced:${storage.torndata.medals.length}>`;
			// @ts-expect-error Modifying a copy of the database for debugging purposes.
			storage.torndata.items = `<reduced:${storage.torndata.items.length}>`;
			// @ts-expect-error Modifying a copy of the database for debugging purposes.
			storage.torndata.itemsMap = `<reduced:${Object.keys(storage.torndata.itemsMap).length}>`;
			// @ts-expect-error Modifying a copy of the database for debugging purposes.
			storage.torndata.stats = `<reduced:${Object.keys(storage.torndata.stats).length}>`;
			// @ts-expect-error Modifying a copy of the database for debugging purposes.
			storage.torndata.properties = `<reduced:${storage.torndata.properties.length}>`;
			// @ts-expect-error Modifying a copy of the database for debugging purposes.
			storage.torndata.calendar.competitions = `<reduced:${storage.torndata.calendar.competitions.length}>`;
			// @ts-expect-error Modifying a copy of the database for debugging purposes.
			storage.torndata.calendar.events = `<reduced:${storage.torndata.calendar.events.length}>`;
			if (storage.factiondata.access === "full_access") {
				// @ts-expect-error Modifying a copy of the database for debugging purposes.
				storage.factiondata.crimes = `<reduced:${Object.values(storage.factiondata.crimes).length}>`;
				// @ts-expect-error Modifying a copy of the database for debugging purposes.
				storage.factiondata.rankedwars = `<reduced:${storage.factiondata.rankedwars.length}>`;
			}
			// @ts-expect-error Modifying a copy of the database for debugging purposes.
			storage.notes.profile = `<reduced:${Object.values(storage.notes.profile).length}>`;
			// @ts-expect-error Modifying a copy of the database for debugging purposes.
			storage.usage = `<reduced:${Object.keys(storage.usage).length}>`;
			// @ts-expect-error Modifying a copy of the database for debugging purposes.
			storage.attackHistory.history = `<reduced:${Object.keys(storage.attackHistory.history).length}>`;

			Object.keys(storage.cache).forEach((cacheKey) => {
				storage.cache[cacheKey] = `<reduced:${Object.values(storage.cache[cacheKey]).length}>`;
			});
		}

		const data = JSON.stringify(storage, null, 4);

		elementBuilder({
			type: "a",
			href: window.URL.createObjectURL(new Blob([data], { type: "octet/stream" })),
			attributes: { download: "torntools-full-data-dump.json" },
		}).click();
	});
}

function forceUpdateAll(backgroundService: BGService) {
	return Promise.all([
		backgroundService.forceUpdate("torndata"),
		backgroundService.forceUpdate("userdata"),
		backgroundService.forceUpdate("stocks"),
		backgroundService.forceUpdate("factiondata"),
	]);
}
