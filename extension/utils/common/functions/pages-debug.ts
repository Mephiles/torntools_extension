import type { ProxyService } from "@webext-core/proxy-service";
import { ttCache } from "@/utils/common/data/cache";
import type { Database } from "@/utils/common/data/database";
import { ttStorage } from "@/utils/common/data/storage";
import { elementBuilder } from "@/utils/common/functions/dom";
import type { BackgroundService } from "@/utils/services/BackgroundService";

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

function fullDataDump() {
	ttStorage.get().then((storage: Database) => {
		Object.values(storage.api).forEach((x) => {
			if (!("key" in x) || !x.key) return;

			if (x.key.startsWith("TS_")) x.key = `TS_<redacted:${x.key.length - 3}>`;
			else x.key = `<redacted:${x.key.length}>`;
		});

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
