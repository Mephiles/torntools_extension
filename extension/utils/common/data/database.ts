import { DatabaseCache, ttCache } from "@/utils/common/data/cache";
import { DatabaseUsage, ttUsage } from "@/utils/common/data/usage";
import { ttStorage } from "@/utils/common/data/storage";
import { DEFAULT_STORAGE, DefaultSetting, DefaultStorageType } from "@/utils/common/data/default-database";
import { sleep, toNumericVersion } from "@/utils/common/functions/utilities";

export type RecursivePartial<T> = T extends (infer U)[] ? RecursivePartial<U>[] : T extends object ? { [P in keyof T]?: RecursivePartial<T[P]> } : T;
export type Writable<T> = T extends object ? { -readonly [K in keyof T]: Writable<T[K]> } : T;

type DatabaseSettings = Writable<DefaultStorageType["settings"]>;
type DatabaseFilters = Writable<DefaultStorageType["filters"]>;
type DatabaseVersion = Writable<DefaultStorageType["version"]>;
type DatabaseApi = Writable<DefaultStorageType["api"]>;
export type DatabaseUserdata = Writable<DefaultStorageType["userdata"]>;
type DatabaseTorndata = Writable<DefaultStorageType["torndata"]>;
type DatabaseStakeouts = Writable<DefaultStorageType["stakeouts"]>;
type DatabaseAttackHistory = Writable<DefaultStorageType["attackHistory"]>;
type DatabaseNotes = Writable<DefaultStorageType["notes"]>;
type DatabaseFactiondata = Writable<DefaultStorageType["factiondata"]>;
type DatabaseQuick = Writable<DefaultStorageType["quick"]>;
type DatabaseLocaldata = Writable<DefaultStorageType["localdata"]>;
type DatabaseNpcs = Writable<DefaultStorageType["npcs"]>;
type DatabaseNotificationHistory = Writable<DefaultStorageType["notificationHistory"]>;
type DatabaseStockdata = Writable<DefaultStorageType["stockdata"]>;
type DatabaseFactionStakeouts = Writable<DefaultStorageType["factionStakeouts"]>;
type DatabaseNotifications = Writable<DefaultStorageType["notifications"]>;

export interface Database {
	settings: DatabaseSettings;
	filters: DatabaseFilters;
	version: DatabaseVersion;
	api: DatabaseApi;
	userdata: DatabaseUserdata;
	torndata: DatabaseTorndata;
	stakeouts: DatabaseStakeouts;
	attackHistory: DatabaseAttackHistory;
	notes: DatabaseNotes;
	factiondata: DatabaseFactiondata;
	quick: DatabaseQuick;
	localdata: DatabaseLocaldata;
	npcs: DatabaseNpcs;
	notificationHistory: DatabaseNotificationHistory;
	stockdata: DatabaseStockdata;
	factionStakeouts: DatabaseFactionStakeouts;
	notifications: DatabaseNotifications;
	cache: DatabaseCache;
	usage: DatabaseUsage;
	time: number | null;
}

export type DatabaseKey = keyof Database;

export let settings: DatabaseSettings;
export let filters: DatabaseFilters;
export let version: DatabaseVersion;
export let api: DatabaseApi;
export let userdata: DatabaseUserdata;
export let torndata: DatabaseTorndata;
export let stakeouts: DatabaseStakeouts;
export let attackHistory: DatabaseAttackHistory;
export let notes: DatabaseNotes;
export let factiondata: DatabaseFactiondata;
export let quick: DatabaseQuick;
export let localdata: DatabaseLocaldata;
export let npcs: DatabaseNpcs;
export let notificationHistory: DatabaseNotificationHistory;
export let stockdata: DatabaseStockdata;
export let factionStakeouts: DatabaseFactionStakeouts;
export let notifications: DatabaseNotifications;

export let databaseLoaded = false;
export let databaseLoading = false;

// Initialize database when module is loaded
//

type StorageListener<T> = (oldValue: T) => void;

interface StorageListeners {
	settings: StorageListener<DatabaseSettings>[];
	filters: StorageListener<DatabaseFilters>[];
	version: StorageListener<DatabaseVersion>[];
	userdata: StorageListener<DatabaseUserdata>[];
	stakeouts: StorageListener<DatabaseStakeouts>[];
	factionStakeouts: StorageListener<DatabaseFactionStakeouts>[];
	notes: StorageListener<DatabaseNotes>[];
	factiondata: StorageListener<DatabaseFactiondata>[];
	localdata: StorageListener<DatabaseLocaldata>[];
	cache: StorageListener<DatabaseCache>[];
	api: StorageListener<DatabaseApi>[];
	npcs: StorageListener<DatabaseNpcs>[];
}

export const storageListeners: StorageListeners = {
	settings: [],
	filters: [],
	version: [],
	userdata: [],
	stakeouts: [],
	factionStakeouts: [],
	notes: [],
	factiondata: [],
	localdata: [],
	cache: [],
	api: [],
	npcs: [],
} as const;

export async function loadDatabase(): Promise<Omit<Database, "time">> {
	if (databaseLoaded) {
		return {
			settings,
			filters,
			version,
			userdata,
			stakeouts,
			factionStakeouts,
			notes,
			factiondata,
			localdata,
			cache: ttCache.cache,
			api,
			npcs,
			torndata,
			notificationHistory,
			attackHistory,
			quick,
			stockdata,
			usage: ttUsage.usage,
			notifications,
		};
	} else if ((databaseLoaded && !settings) || databaseLoading) {
		await sleep(75);
		return await loadDatabase();
	}

	databaseLoading = true;

	const database = await ttStorage.get();

	populateDatabaseVariables(database);

	console.log("TT - Database loaded.", database);
	databaseLoaded = true;
	return database;
}

export async function migrateDatabase(force = false): Promise<void> {
	try {
		const loadedStorage = await ttStorage.get();

		if (!loadedStorage || !Object.keys(loadedStorage).length) {
			console.log("TT - Fresh installation detected, setting up default storage.");
			await ttStorage.reset();
			await loadDatabase();
			return;
		}

		const storedVersion = loadedStorage?.version?.current || "5.0.0";
		const currentVersion = chrome.runtime.getManifest().version;

		console.log(`TT - Migration check: ${storedVersion} -> ${currentVersion}`);

		if (!force && toNumericVersion(storedVersion) >= toNumericVersion(currentVersion)) {
			console.log("TT - No migration needed, using existing storage.");
			populateDatabaseVariables(loadedStorage);
			return;
		}

		const migratedStorage = convertStorage(loadedStorage, DEFAULT_STORAGE);

		await ttStorage.set(migratedStorage);

		populateDatabaseVariables(migratedStorage);

		console.log("TT - Database migration completed successfully.");
	} catch (error) {
		console.error("TT - Database migration failed:", error);
		await loadDatabase();
	}
}

function convertStorage(oldStorage: any, defaultStorage: any): any {
	const newStorage: any = {};

	for (const key in defaultStorage) {
		if (!oldStorage) oldStorage = {};
		if (!(key in oldStorage)) oldStorage[key] = {};

		const defaultValue = defaultStorage[key];
		if (typeof defaultValue === "object" && defaultValue !== null) {
			if (defaultValue instanceof DefaultSetting) {
				newStorage[key] = migrateDefaultSetting(oldStorage[key], defaultValue);
			} else {
				newStorage[key] = convertStorage(oldStorage[key], defaultValue);
			}
		} else {
			newStorage[key] = oldStorage[key] ?? defaultValue;
		}
	}

	return newStorage;
}

function migrateDefaultSetting(oldValue: any, setting: DefaultSetting<any>): any {
	if (isValidSettingValue(oldValue, setting)) {
		return oldValue;
	}

	if (setting.defaultValue) {
		return typeof setting.defaultValue === "function" ? setting.defaultValue() : setting.defaultValue;
	}

	return null;
}

function isValidSettingValue(value: any, setting: DefaultSetting<any>): boolean {
	if (setting.type === "array") {
		return Array.isArray(value);
	}

	const validTypes = setting.type.split("|");
	return validTypes.some((type) => (type === "empty" && value === "") || typeof value === type);
}

function populateDatabaseVariables(database: Database) {
	settings = database.settings;
	filters = database.filters;
	version = database.version;
	api = database.api;
	userdata = database.userdata;
	torndata = database.torndata;
	localdata = database.localdata;
	stakeouts = database.stakeouts;
	attackHistory = database.attackHistory;
	notes = database.notes;
	factiondata = database.factiondata;
	quick = database.quick;
	npcs = database.npcs;
	stockdata = database.stockdata;
	factionStakeouts = database.factionStakeouts;
	notificationHistory = database.notificationHistory;
	notifications = database.notifications;

	ttCache.cache = database.cache;
	ttUsage.usage = database.usage;
}

export function initializeDatabase() {
	loadDatabase().catch(() => console.error("TT - Failed to load database."));
	browser.storage.onChanged.addListener((changes, area) => {
		if (area === "local") {
			for (const key in changes) {
				switch (key) {
					case "settings":
						// @ts-expect-error Bundling Migration
						settings = changes.settings.newValue;
						break;
					case "filters":
						// @ts-expect-error Bundling Migration
						filters = changes.filters.newValue;
						break;
					case "version":
						// @ts-expect-error Bundling Migration
						version = changes.version.newValue;
						break;
					case "userdata":
						// @ts-expect-error Bundling Migration
						userdata = changes.userdata.newValue;
						break;
					case "api":
						// @ts-expect-error Bundling Migration
						api = changes.api.newValue;
						break;
					case "torndata":
						// @ts-expect-error Bundling Migration
						torndata = changes.torndata.newValue;
						break;
					case "stakeouts":
						// @ts-expect-error Bundling Migration
						stakeouts = changes.stakeouts.newValue;
						break;
					case "attackHistory":
						// @ts-expect-error Bundling Migration
						attackHistory = changes.attackHistory.newValue;
						break;
					case "notes":
						// @ts-expect-error Bundling Migration
						notes = changes.notes.newValue;
						break;
					case "factiondata":
						// @ts-expect-error Bundling Migration
						factiondata = changes.factiondata.newValue;
						break;
					case "quick":
						// @ts-expect-error Bundling Migration
						quick = changes.quick.newValue;
						break;
					case "localdata":
						// @ts-expect-error Bundling Migration
						localdata = changes.localdata.newValue;
						break;
					case "cache":
						ttCache.cache = changes.cache.newValue;
						break;
					case "usage":
						// @ts-expect-error Bundling Migration
						ttUsage.usage = changes.usage.newValue;
						break;
					case "npcs":
						// @ts-expect-error Bundling Migration
						npcs = changes.npcs.newValue;
						break;
					case "stockdata":
						// @ts-expect-error Bundling Migration
						stockdata = changes.stockdata.newValue;
						break;
					case "notificationHistory":
						// @ts-expect-error Bundling Migration
						if (typeof notificationHistory !== "undefined") notificationHistory = changes.notificationHistory.newValue;
						break;
					case "factionStakeouts":
						// @ts-expect-error Bundling Migration
						factionStakeouts = changes.factionStakeouts.newValue;
						break;
				}
				if (storageListeners[key]) storageListeners[key].forEach((listener) => listener(changes[key].oldValue));
			}
		}
	});
}

export function setUserdata(data: DatabaseUserdata) {
	userdata = data;
}

export function setFactiondata(data: DatabaseFactiondata) {
	factiondata = data;
}

export function setFactionStakeouts(data: DatabaseFactionStakeouts) {
	factionStakeouts = data;
}

export function setTorndata(data: DatabaseTorndata) {
	torndata = data;
}

export function setNotificationHistory(data: DatabaseNotificationHistory) {
	notificationHistory = data;
}
