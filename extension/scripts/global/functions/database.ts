type DatabaseSettings = Writable<DefaultStorageType["settings"]>;
type DatabaseFilters = Writable<DefaultStorageType["filters"]>;
type DatabaseVersion = Writable<DefaultStorageType["version"]>;
type DatabaseApi = Writable<DefaultStorageType["api"]>;
type DatabaseUserdata = Writable<DefaultStorageType["userdata"]>;
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

interface Database {
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
}

let settings: DatabaseSettings;
let filters: DatabaseFilters;
let version: DatabaseVersion;
let api: DatabaseApi;
let userdata: DatabaseUserdata;
let torndata: DatabaseTorndata;
let stakeouts: DatabaseStakeouts;
let attackHistory: DatabaseAttackHistory;
let notes: DatabaseNotes;
let factiondata: DatabaseFactiondata;
let quick: DatabaseQuick;
let localdata: DatabaseLocaldata;
let npcs: DatabaseNpcs;
let notificationHistory: DatabaseNotificationHistory;
let stockdata: DatabaseStockdata;
let factionStakeouts: DatabaseFactionStakeouts;
let notifications: DatabaseNotifications;

let databaseLoaded = false;
let databaseLoading = false;

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

const storageListeners: StorageListeners = {
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

async function loadDatabase() {
	if (databaseLoaded) return Promise.resolve();
	else if ((databaseLoaded && !settings) || databaseLoading) {
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

async function migrateDatabase(force = false) {
	const loadedStorage = await ttStorage.get();
	if (!loadedStorage || !Object.keys(loadedStorage).length) {
		console.log("Setting new storage.");
		await ttStorage.reset();
		return;
	}

	const storedVersion = loadedStorage?.version?.current || "5.0.0";
	const loadedVersion = chrome.runtime.getManifest().version;

	let migratedStorage;
	if (force || toNumericVersion(storedVersion) < toNumericVersion(loadedVersion)) {
		migratedStorage = convertGeneral(loadedStorage, DEFAULT_STORAGE);
		convertSpecific(loadedStorage, migratedStorage);

		await ttStorage.set(migratedStorage);

		const keys = Object.keys(migratedStorage);
		const outdatedKeys = Object.keys(loadedStorage).filter((key) => !keys.includes(key));
		if (outdatedKeys.length) await ttStorage.remove(outdatedKeys);
	} else {
		migratedStorage = loadedStorage;
	}

	populateDatabaseVariables(migratedStorage);

	function convertGeneral(oldStorage: any, defaultStorage: any) {
		const newStorage = {};

		for (const key in defaultStorage) {
			if (!oldStorage) oldStorage = {};
			if (!(key in oldStorage)) oldStorage[key] = {};

			if (typeof defaultStorage[key] === "object") {
				const storage = defaultStorage[key];
				if (storage instanceof DefaultSetting) {
					let useCurrent = true;

					if (storage.type === "array") {
						if (!Array.isArray(oldStorage[key])) {
							useDefault();
							useCurrent = false;
						}
					} else if (!storage.type.split("|").some((value) => value === typeof oldStorage[key] || (value === "empty" && oldStorage[key] === ""))) {
						useDefault();
						useCurrent = false;
					}

					if (useCurrent) newStorage[key] = oldStorage[key];
				} else {
					newStorage[key] = convertGeneral(oldStorage[key], defaultStorage[key]);
				}
			}

			function useDefault() {
				if (!defaultStorage[key].hasOwnProperty("defaultValue")) return;

				switch (typeof defaultStorage[key].defaultValue) {
					case "function":
						newStorage[key] = defaultStorage[key].defaultValue();
						break;
					case "boolean":
						newStorage[key] = defaultStorage[key].defaultValue;
						break;
					default:
						newStorage[key] = defaultStorage[key].defaultValue;
						break;
				}
			}
		}

		return newStorage;
	}

	function convertSpecific(storage: any, newStorage: any) {
		const version = toNumericVersion(storedVersion);

		let updated = false;
		if (version <= toNumericVersion("5")) {
			if (storage?.notes?.text || storage?.notes?.height) {
				newStorage.notes.sidebar.text = storage.notes.text || "";
				newStorage.notes.sidebar.height = storage.notes.height || "22px";
			}
			if (storage?.profile_notes?.profiles) {
				for (const [id, profileNote] of Object.entries(storage.profile_notes.profiles)) {
					const note = profileNote as { height?: string; notes?: string };
					newStorage.notes.profile[id] = { height: note.height || "17px", text: note.notes };
				}
			}
			newStorage.quick.items = storage?.quick?.items?.map((id) => ({ id: parseInt(id) })) || [];
			if (storage?.stakeouts)
				newStorage.stakeouts = Object.entries(storage.stakeouts)
					.filter(([id]) => !isNaN(parseInt(id)) && !!parseInt(id))
					.map(([id, stakeout]) => {
						const stakeoutData = stakeout as { notifications?: { okay?: boolean; hospital?: boolean; lands?: boolean; online?: boolean } };
						return {
							[id]: {
								alerts: {
									okay: stakeoutData.notifications?.okay || false,
									hospital: stakeoutData.notifications?.hospital || false,
									landing: stakeoutData.notifications?.lands || false,
									online: stakeoutData.notifications?.online || false,
									life: false,
									offline: false,
								},
							},
						};
					})
					.filter((result) => Object.values(result)[0] !== undefined)
					.reduce((prev, current) => ({ ...prev, ...current }), {});
			if (storage?.stock_alerts)
				newStorage.settings.notifications.types.stocks = Object.entries(storage.stock_alerts)
					.filter(([id]) => !isNaN(parseInt(id)) && !!parseInt(id))
					.map(([id, alert]) => {
						const alertData = alert as { fall?: string | number; reach?: string | number };
						return {
							[id]: {
								priceFalls: typeof alertData.fall === "number" ? alertData.fall : parseInt(String(alertData.fall || "")) || "",
								priceReaches: typeof alertData.reach === "number" ? alertData.reach : parseInt(String(alertData.reach || "")) || "",
							},
						};
					})
					.reduce((prev, current) => ({ ...prev, ...current }), {});

			// Reset
			newStorage.quick.crimes = [];
			newStorage.userdata = {};
			newStorage.torndata = {};
			newStorage.cache = {};
			updated = true;
		} else if (version === toNumericVersion("6.0.0")) {
			newStorage.settings.apiUsage.comment = storage?.settings?.apiUsage?.comment || "TornTools";
			updated = true;
		} else if (version <= toNumericVersion("6.3.0")) {
			newStorage.localdata.vault = undefined;
			updated = true;
		} else if (version <= toNumericVersion("6.16.0")) {
			newStorage.stakeouts.order = Object.keys(newStorage.stakeouts).filter((id) => !isNaN(parseInt(id)));
			updated = true;
		} else if (version <= toNumericVersion("6.26.0")) {
			newStorage.notifications = {
				events: {},
				messages: {},
				newDay: {},
				energy: {},
				happy: {},
				nerve: {},
				life: {},
				travel: {},
				drugs: {},
				boosters: {},
				medical: {},
				hospital: {},
				chain: {},
				chainCount: {},
				stakeouts: {},
				npcs: {},
			};
			updated = true;
		} else if (version <= toNumericVersion("7.4.2")) {
			if (storage?.settings?.pages?.global?.reviveProvider === "imperium") {
				newStorage.settings.pages.global.reviveProvider = "";
			}
			updated = true;
		} else if (version <= toNumericVersion("7.5.0")) {
			if (storage?.settings?.apiUsage?.user?.personalstats === false) {
				newStorage.settings.apiUsage.user.personalstats = false;
			}
			updated = true;
		} else if (version <= toNumericVersion("7.5.2")) {
			if (storage?.settings?.apiUsage?.user?.attacks === false) {
				newStorage.settings.apiUsage.user.attacks = false;
			}
			if (storage?.cache && "faction-members" in storage.cache) {
				newStorage.cache = {
					...(storage?.cache ?? {}),
					"faction-members": {},
				};
			}

			updated = true;
		} else if (version <= toNumericVersion("7.6.0")) {
			newStorage.userdata = {};
			newStorage.torndata = {};

			updated = true;
		} else if (version <= toNumericVersion("7.7.1")) {
			let stats = replaceProfileBoxStat(storage.filters.profile.stats, "Bazaar income", "Bazaar revenue");
			stats = replaceProfileBoxStat(stats, "Market buys", "Items bought from market");
			stats = replaceProfileBoxStat(stats, "Times trained", "Times trained by director");
			stats = replaceProfileBoxStat(stats, "Elo Rating", "Elo rating");
			stats = replaceProfileBoxStat(stats, "Meds used", "Medical items used");
			stats = replaceProfileBoxStat(stats, "Classified ads", "Classified ads placed");
			stats = replaceProfileBoxStat(stats, "Vandalism", "Vandalism offenses");
			stats = replaceProfileBoxStat(stats, "Theft", "Theft offenses");
			stats = replaceProfileBoxStat(stats, "Counterfeiting", "Counterfeiting offenses");
			stats = replaceProfileBoxStat(stats, "Illicit services", "Illicit services offenses");
			stats = replaceProfileBoxStat(stats, "Cybercrime", "Cybercrime offenses");
			stats = replaceProfileBoxStat(stats, "Extortion", "Extortion offenses");
			stats = replaceProfileBoxStat(stats, "Illegal production", "Illegal production offenses");
			newStorage.filters.profile.stats = stats;

			updated = true;
		} else if (version <= toNumericVersion("7.7.4")) {
			newStorage.attackHistory.history = Object.entries(storage.attackHistory.history).reduce((previousValue, [id, data]) => {
				const entry = data as { respect?: number[]; respect_base?: number[]; [key: string]: any };
				return {
					...previousValue,
					[id]: {
						...entry,
						respect: (entry.respect || []).filter((r) => !!r),
						respect_base: (entry.respect_base || []).filter((r) => !!r),
					},
				};
			}, {});

			updated = true;
		}
		if (version <= toNumericVersion("7.8.2")) {
			// Reset cache.
			newStorage.cache = {};
			newStorage.userdata = {};

			if (storage?.settings?.apiUsage?.user?.money === false) {
				newStorage.settings.apiUsage.user.money = false;
			}
			if (storage?.settings?.apiUsage?.user?.honors === false) {
				newStorage.settings.apiUsage.user.honors = false;
			}
			newStorage.torndata = {};

			updated = true;
		}
		if (version <= toNumericVersion("7.8.4")) {
			newStorage.cache["profile-stats"] = {};

			updated = true;
		}
		if (version <= toNumericVersion("7.8.5")) {
			newStorage.settings.apiUsage.user = {
				...(storage.settings?.apiUsage?.user ?? {}),
				...(storage.settings?.apiUsage?.userV2 ?? {}),
			};
			newStorage.cache.job = {};

			updated = true;
		}
		if (version < toNumericVersion("8.0.4")) {
			if (storage?.filters?.jail?.bailCost === 5000) newStorage.filters.jail.bailCost = -1;
			if (storage?.factionStakeouts)
				newStorage.factionStakeouts = Object.entries(storage.factionStakeouts).reduce((map, [id, value]) => {
					if (typeof value === "object" && "alerts" in value && typeof value.alerts === "object") {
						const oldAlerts: any = value.alerts;

						map[id] = {
							...value,
							alerts: {
								...oldAlerts,
								chainReaches: oldAlerts.chainReaches || false,
								memberCountDrops: oldAlerts.memberCountDrops || false,
							},
						};
					} else {
						map[id] = value;
					}

					return map;
				}, {});
			newStorage.notificationHistory = storage.notificationHistory.filter((notification: any) => !!notification.title && !!notification.message);

			updated = true;
		}
		if (version < toNumericVersion("8.1.0")) {
			if (storage?.settings?.pages?.global?.reviveProvider === "hela") {
				newStorage.settings.pages.global.reviveProvider = "midnight_x";
			}

			updated = true;
		}

		if (updated) {
			console.log(`Upgraded database from ${storedVersion} to ${loadedVersion}`);
		}

		newStorage.version.current = loadedVersion;

		function replaceProfileBoxStat(stats: string[], oldStat: string, newStat: string) {
			const index = stats.indexOf(oldStat);
			if (index === -1) return stats;

			const newStats = stats.filter((stat) => stat !== oldStat);
			newStats.insertAt(index, newStat);

			return newStats;
		}
	}
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

chrome.storage.onChanged.addListener((changes, area) => {
	if (area === "local") {
		for (const key in changes) {
			switch (key) {
				case "settings":
					settings = changes.settings.newValue;
					break;
				case "filters":
					filters = changes.filters.newValue;
					break;
				case "version":
					version = changes.version.newValue;
					break;
				case "userdata":
					userdata = changes.userdata.newValue;
					break;
				case "api":
					api = changes.api.newValue;
					break;
				case "torndata":
					torndata = changes.torndata.newValue;
					break;
				case "stakeouts":
					stakeouts = changes.stakeouts.newValue;
					break;
				case "attackHistory":
					attackHistory = changes.attackHistory.newValue;
					break;
				case "notes":
					notes = changes.notes.newValue;
					break;
				case "factiondata":
					factiondata = changes.factiondata.newValue;
					break;
				case "quick":
					quick = changes.quick.newValue;
					break;
				case "localdata":
					localdata = changes.localdata.newValue;
					break;
				case "cache":
					ttCache.cache = changes.cache.newValue;
					break;
				case "usage":
					ttUsage.usage = changes.usage.newValue;
					break;
				case "npcs":
					npcs = changes.npcs.newValue;
					break;
				case "stockdata":
					stockdata = changes.stockdata.newValue;
					break;
				case "notificationHistory":
					if (typeof notificationHistory !== "undefined") notificationHistory = changes.notificationHistory.newValue;
					break;
				case "factionStakeouts":
					factionStakeouts = changes.factionStakeouts.newValue;
					break;
			}
			if (storageListeners[key]) storageListeners[key].forEach((listener) => listener(changes[key].oldValue));
		}
	}
});
