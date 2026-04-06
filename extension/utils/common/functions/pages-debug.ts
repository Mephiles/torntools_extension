import { ttStorage } from "@/utils/common/data/storage";
import { elementBuilder } from "@/utils/common/functions/dom";
import { Database } from "@/utils/common/data/database";
import { BACKGROUND_SERVICE } from "@/utils/services/proxy-services";
import { ttCache } from "@/utils/common/data/cache";

// declare global {
// 	interface Window {
// 		DebugFunctions: any;
// 		InternalObjects: any;
// 	}
// }

export function exposeDebugObjects() {
	// noinspection JSUnusedGlobalSymbols
	globalThis.DebugFunctions = {
		fullDataDump,
		forceUpdateUserdata: () => BACKGROUND_SERVICE.forceUpdate("userdata"),
		forceUpdateTorndata: () => BACKGROUND_SERVICE.forceUpdate("torndata"),
		forceUpdateAll,
		reinitializeTimers: () => BACKGROUND_SERVICE.reinitializeTimers(),
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

function forceUpdateAll() {
	return Promise.all([
		BACKGROUND_SERVICE.forceUpdate("torndata"),
		BACKGROUND_SERVICE.forceUpdate("userdata"),
		BACKGROUND_SERVICE.forceUpdate("stocks"),
		BACKGROUND_SERVICE.forceUpdate("factiondata"),
	]);
}
