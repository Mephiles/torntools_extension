import { type DatabaseCache, ttCache } from "@common/utils/data/cache";
import { DEFAULT_STORAGE, DefaultSetting, type DefaultStorageType } from "@common/utils/data/default-database";
import { executeMigrationScripts } from "@common/utils/data/migrations";
import { ttStorage } from "@common/utils/data/storage";
import { sleep } from "@common/utils/functions/utilities";
import { browser } from "wxt/browser";

export type RecursivePartial<T> = T extends (infer U)[] ? RecursivePartial<U>[] : T extends object ? { [P in keyof T]?: RecursivePartial<T[P]> } : T;
export type Writable<T> = T extends object ? { -readonly [K in keyof T]: Writable<T[K]> } : T;

export type DatabaseSettings = Writable<DefaultStorageType["settings"]>;
type DatabaseFilters = Writable<DefaultStorageType["filters"]>;
type DatabaseVersion = Writable<DefaultStorageType["version"]>;
export type DatabaseApi = Writable<DefaultStorageType["api"]>;
export type DatabaseUserdata = Writable<DefaultStorageType["userdata"]>;
export type DatabaseTorndata = Writable<DefaultStorageType["torndata"]>;
export type DatabaseStakeouts = Writable<DefaultStorageType["stakeouts"]>;
export type DatabaseAttackHistory = Writable<DefaultStorageType["attackHistory"]>;
type DatabaseNotes = Writable<DefaultStorageType["notes"]>;
export type DatabaseFactiondata = Writable<DefaultStorageType["factiondata"]>;
type DatabaseQuick = Writable<DefaultStorageType["quick"]>;
export type DatabaseLocaldata = Writable<DefaultStorageType["localdata"]>;
export type DatabaseNpcs = Writable<DefaultStorageType["npcs"]>;
export type DatabaseNotificationHistory = Writable<DefaultStorageType["notificationHistory"]>;
export type DatabaseStockdata = Writable<DefaultStorageType["stockdata"]>;
export type DatabaseFactionStakeouts = Writable<DefaultStorageType["factionStakeouts"]>;
type DatabaseNotifications = Writable<DefaultStorageType["notifications"]>;
type DatabaseMigrations = Writable<DefaultStorageType["migrations"]>;

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
	migrations: DatabaseMigrations;
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
export let migrations: DatabaseMigrations;

let databaseLoaded = false;
let databaseLoading = false;

// Initialize database when module is loaded
//

type StorageListener<T> = (oldValue: T, newValue: T) => void;

interface StorageListeners {
	settings: StorageListener<DatabaseSettings>[];
	filters: StorageListener<DatabaseFilters>[];
	version: StorageListener<DatabaseVersion>[];
	userdata: StorageListener<DatabaseUserdata>[];
	torndata: StorageListener<DatabaseTorndata>[];
	attackHistory: StorageListener<DatabaseAttackHistory>[];
	stakeouts: StorageListener<DatabaseStakeouts>[];
	factionStakeouts: StorageListener<DatabaseFactionStakeouts>[];
	notes: StorageListener<DatabaseNotes>[];
	factiondata: StorageListener<DatabaseFactiondata>[];
	localdata: StorageListener<DatabaseLocaldata>[];
	cache: StorageListener<DatabaseCache>[];
	api: StorageListener<DatabaseApi>[];
	npcs: StorageListener<DatabaseNpcs>[];
	stockdata: StorageListener<DatabaseStockdata>[];
	notificationHistory: StorageListener<DatabaseNotificationHistory>[];
	notifications: StorageListener<DatabaseNotifications>[];
	quick: StorageListener<DatabaseQuick>[];
	migrations: StorageListener<DatabaseMigrations>[];
}

export const storageListeners: StorageListeners = {
	settings: [],
	filters: [],
	version: [],
	userdata: [],
	torndata: [],
	attackHistory: [],
	stakeouts: [],
	factionStakeouts: [],
	notes: [],
	factiondata: [],
	localdata: [],
	cache: [],
	api: [],
	npcs: [],
	stockdata: [],
	notificationHistory: [],
	notifications: [],
	quick: [],
	migrations: [],
} as const;

export async function loadDatabase(force = false): Promise<Omit<Database, "time">> {
	if (databaseLoaded && !force) {
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
			notifications,
			migrations,
		};
	} else if ((databaseLoaded && !settings) || databaseLoading) {
		await sleep(75);
		return await loadDatabase(force);
	}

	databaseLoading = true;

	const database = await ttStorage.get();

	populateDatabaseVariables(database);

	console.log("TT - Database loaded.", database);
	databaseLoaded = true;
	databaseLoading = false;
	return database;
}

// biome-ignore lint/correctness/noUnusedFunctionParameters: Might only be temporary unused.
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
		const currentVersion = browser.runtime.getManifest().version;

		console.log(`TT - Migration check: ${storedVersion} -> ${currentVersion}`);

		// if (!force && toNumericVersion(storedVersion) >= toNumericVersion(currentVersion)) {
		// 	console.log("TT - No migration needed, using existing storage.");
		// 	populateDatabaseVariables(loadedStorage);
		// 	return;
		// }

		const migratedStorage = convertStorage<Database>(loadedStorage, DEFAULT_STORAGE);
		await executeMigrationScripts(migratedStorage, loadedStorage);

		migratedStorage.version.current = currentVersion;

		await ttStorage.set(migratedStorage);

		populateDatabaseVariables(migratedStorage);

		console.log("TT - Database migration completed successfully.");
	} catch (error) {
		console.error("TT - Database migration failed:", error);
		await loadDatabase();
	}
}

function convertStorage<T = any>(oldStorage: any, defaultStorage: any): T {
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
	migrations = database.migrations;

	ttCache.cache = database.cache;
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
						settings = changes.settings.newValue as DatabaseSettings;
						break;
					case "filters":
						filters = changes.filters.newValue as DatabaseFilters;
						break;
					case "version":
						version = changes.version.newValue as DatabaseVersion;
						break;
					case "userdata":
						userdata = changes.userdata.newValue as DatabaseUserdata;
						break;
					case "api":
						api = changes.api.newValue as DatabaseApi;
						break;
					case "torndata":
						torndata = changes.torndata.newValue as DatabaseTorndata;
						break;
					case "stakeouts":
						stakeouts = changes.stakeouts.newValue as DatabaseStakeouts;
						break;
					case "attackHistory":
						attackHistory = changes.attackHistory.newValue as DatabaseAttackHistory;
						break;
					case "notes":
						notes = changes.notes.newValue as DatabaseNotes;
						break;
					case "factiondata":
						factiondata = changes.factiondata.newValue as DatabaseFactiondata;
						break;
					case "quick":
						quick = changes.quick.newValue as DatabaseQuick;
						break;
					case "localdata":
						localdata = changes.localdata.newValue as DatabaseLocaldata;
						break;
					case "cache":
						ttCache.cache = changes.cache.newValue as DatabaseCache;
						break;
					case "npcs":
						npcs = changes.npcs.newValue as DatabaseNpcs;
						break;
					case "stockdata":
						stockdata = changes.stockdata.newValue as DatabaseStockdata;
						break;
					case "notificationHistory":
						notificationHistory = changes.notificationHistory.newValue as DatabaseNotificationHistory;
						break;
					case "notifications":
						notifications = changes.notifications.newValue as DatabaseNotifications;
						break;
					case "factionStakeouts":
						factionStakeouts = changes.factionStakeouts.newValue as DatabaseFactionStakeouts;
						break;
				}
				if (storageListeners[key])
					storageListeners[key].forEach((listener: StorageListener<any>) => listener(changes[key].oldValue, changes[key].newValue));
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
