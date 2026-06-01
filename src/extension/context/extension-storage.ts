import { type DatabaseCache, ttCache } from "@utils/data/cache";
import {
	api,
	type Database,
	type DatabaseApi,
	type DatabaseAttackHistory,
	type DatabaseFactiondata,
	type DatabaseFactionStakeouts,
	type DatabaseFilters,
	type DatabaseKey,
	type DatabaseLocaldata,
	type DatabaseNotes,
	type DatabaseNotificationHistory,
	type DatabaseNpcs,
	type DatabaseQuick,
	type DatabaseSettings,
	type DatabaseStakeouts,
	type DatabaseStockdata,
	type DatabaseTorndata,
	type DatabaseUserdata,
	type DatabaseVersion,
	loadDatabase,
	type StorageListener,
	setApi,
	setAttackHistory,
	setFactiondata,
	setFactionStakeouts,
	setFilters,
	setLocaldata,
	setNotes,
	setNotificationHistory,
	setNpcs,
	setQuick,
	setSettings,
	setStakeouts,
	setStockdata,
	setTorndata,
	setUserdata,
	setVersion,
	storageListeners,
} from "@utils/data/database";
import { DEFAULT_STORAGE, getDefaultStorage } from "@utils/data/default-database";
import { TornToolsStorage } from "@utils/data/storage";
import { type DatabaseUsage, ttUsage } from "@utils/data/usage";
import { browser } from "wxt/browser";

export class TTExtensionStorage extends TornToolsStorage {
	get(): Promise<Database>;
	get<K extends DatabaseKey>(key: K): Promise<Database[K]>;
	get<K extends readonly DatabaseKey[]>(keys: K): Promise<{ [I in keyof K]: K[I] extends DatabaseKey ? Database[K[I]] : never }>;
	get(key?: DatabaseKey | DatabaseKey[]) {
		return new Promise(async (resolve) => {
			if (Array.isArray(key)) {
				const data = await browser.storage.local.get(key);

				resolve(key.map((i) => data[i]));
			} else if (key) {
				const data = await browser.storage.local.get([key]);

				resolve(data[key]);
			} else {
				const data = await browser.storage.local.get(null);

				resolve(data);
			}
		});
	}

	set(object: { [key: string]: any }) {
		return browser.storage.local.set(object);
	}

	remove(key: string | string[]) {
		return browser.storage.local.remove(Array.isArray(key) ? key : [key]);
	}

	clear() {
		return browser.storage.local.clear();
	}

	reset(key?: "attackHistory" | "stakeouts"): Promise<void> {
		return new Promise(async (resolve) => {
			if (["attackHistory", "stakeouts"].includes(key)) {
				await this.set({ [key]: getDefaultStorage(DEFAULT_STORAGE)[key] });

				resolve();
			} else {
				const apiKey = api ? api.torn.key : undefined;

				await this.clear();
				await this.set(getDefaultStorage(DEFAULT_STORAGE));
				await this.change({ api: { torn: { key: apiKey } } });

				console.log("Storage cleared");
				console.log("New storage", await this.get());

				resolve();
			}
		});
	}

	async getSize() {
		let size: number;

		if (browser.storage.local.getBytesInUse) size = await browser.storage.local.getBytesInUse();
		else size = JSON.stringify(await this.get(null)).length;

		return size;
	}
}
export function initializeDatabase() {
	loadDatabase().catch(() => console.error("TT - Failed to load database."));
	initializeDatabaseListener();
}

function initializeDatabaseListener() {
	browser.storage.onChanged.addListener((changes, area) => {
		if (area === "local") {
			for (const key in changes) {
				switch (key) {
					case "settings":
						setSettings(changes.settings.newValue as DatabaseSettings);
						break;
					case "filters":
						setFilters(changes.filters.newValue as DatabaseFilters);
						break;
					case "version":
						setVersion(changes.version.newValue as DatabaseVersion);
						break;
					case "userdata":
						setUserdata(changes.userdata.newValue as DatabaseUserdata);
						break;
					case "api":
						setApi(changes.api.newValue as DatabaseApi);
						break;
					case "torndata":
						setTorndata(changes.torndata.newValue as DatabaseTorndata);
						break;
					case "stakeouts":
						setStakeouts(changes.stakeouts.newValue as DatabaseStakeouts);
						break;
					case "attackHistory":
						setAttackHistory(changes.attackHistory.newValue as DatabaseAttackHistory);
						break;
					case "notes":
						setNotes(changes.notes.newValue as DatabaseNotes);
						break;
					case "factiondata":
						setFactiondata(changes.factiondata.newValue as DatabaseFactiondata);
						break;
					case "quick":
						setQuick(changes.quick.newValue as DatabaseQuick);
						break;
					case "localdata":
						setLocaldata(changes.localdata.newValue as DatabaseLocaldata);
						break;
					case "cache":
						ttCache.cache = changes.cache.newValue as DatabaseCache;
						break;
					case "usage":
						ttUsage.usage = changes.usage.newValue as DatabaseUsage;
						break;
					case "npcs":
						setNpcs(changes.npcs.newValue as DatabaseNpcs);
						break;
					case "stockdata":
						setStockdata(changes.stockdata.newValue as DatabaseStockdata);
						break;
					case "notificationHistory":
						setNotificationHistory(changes.notificationHistory.newValue as DatabaseNotificationHistory);
						break;
					case "factionStakeouts":
						setFactionStakeouts(changes.factionStakeouts.newValue as DatabaseFactionStakeouts);
						break;
				}
				if (storageListeners[key])
					storageListeners[key].forEach((listener: StorageListener<any>) => listener(changes[key].oldValue, changes[key].newValue));
			}
		}
	});
}
