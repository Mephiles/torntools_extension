import { ttStorage } from "@utils/context";
import { type DatabaseCache, ttCache } from "@utils/data/cache";
import type { DefaultStorageType } from "@utils/data/default-database";
import { type DatabaseUsage, ttUsage } from "@utils/data/usage";
import { sleep } from "@utils/functions/utilities";

export type RecursivePartial<T> = T extends (infer U)[] ? RecursivePartial<U>[] : T extends object ? { [P in keyof T]?: RecursivePartial<T[P]> } : T;
export type Writable<T> = T extends object ? { -readonly [K in keyof T]: Writable<T[K]> } : T;

export type DatabaseSettings = Writable<DefaultStorageType["settings"]>;
export type DatabaseFilters = Writable<DefaultStorageType["filters"]>;
export type DatabaseVersion = Writable<DefaultStorageType["version"]>;
export type DatabaseApi = Writable<DefaultStorageType["api"]>;
export type DatabaseUserdata = Writable<DefaultStorageType["userdata"]>;
export type DatabaseTorndata = Writable<DefaultStorageType["torndata"]>;
export type DatabaseStakeouts = Writable<DefaultStorageType["stakeouts"]>;
export type DatabaseAttackHistory = Writable<DefaultStorageType["attackHistory"]>;
export type DatabaseNotes = Writable<DefaultStorageType["notes"]>;
export type DatabaseFactiondata = Writable<DefaultStorageType["factiondata"]>;
export type DatabaseQuick = Writable<DefaultStorageType["quick"]>;
export type DatabaseLocaldata = Writable<DefaultStorageType["localdata"]>;
export type DatabaseNpcs = Writable<DefaultStorageType["npcs"]>;
export type DatabaseNotificationHistory = Writable<DefaultStorageType["notificationHistory"]>;
export type DatabaseStockdata = Writable<DefaultStorageType["stockdata"]>;
export type DatabaseFactionStakeouts = Writable<DefaultStorageType["factionStakeouts"]>;
export type DatabaseNotifications = Writable<DefaultStorageType["notifications"]>;
export type DatabaseMigrations = Writable<DefaultStorageType["migrations"]>;

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

export type StorageListener<T> = (oldValue: T, newValue: T) => void;

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
			usage: ttUsage.usage,
			notifications,
			migrations,
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
	databaseLoading = false;
	return database;
}

export function populateDatabaseVariables(database: Database) {
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
	ttUsage.usage = database.usage;
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

export function setLocaldata(data: DatabaseLocaldata) {
	localdata = data;
}

export function setNotificationHistory(data: DatabaseNotificationHistory) {
	notificationHistory = data;
}

export function setSettings(data: DatabaseSettings) {
	settings = data;
}

export function setFilters(data: DatabaseFilters) {
	filters = data;
}

export function setVersion(data: DatabaseVersion) {
	version = data;
}

export function setApi(data: DatabaseApi) {
	api = data;
}

export function setStakeouts(data: DatabaseStakeouts) {
	stakeouts = data;
}

export function setAttackHistory(data: DatabaseAttackHistory) {
	attackHistory = data;
}

export function setNotes(data: DatabaseNotes) {
	notes = data;
}

export function setQuick(data: DatabaseQuick) {
	quick = data;
}

export function setNpcs(data: DatabaseNpcs) {
	npcs = data;
}

export function setStockdata(data: DatabaseStockdata) {
	stockdata = data;
}
