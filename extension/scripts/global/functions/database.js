"use strict";

let settings,
	filters,
	version,
	api,
	userdata,
	torndata,
	stakeouts,
	attackHistory,
	notes,
	factiondata,
	quick,
	localdata,
	npcs,
	notificationHistory,
	stockdata,
	factionStakeouts,
	notifications;
let databaseLoaded = false;
let databaseLoading = false;
const storageListeners = {
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
};

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

	function convertGeneral(oldStorage, defaultStorage) {
		const newStorage = {};

		for (const key in defaultStorage) {
			if (!oldStorage) oldStorage = {};
			if (!(key in oldStorage)) oldStorage[key] = {};

			if (typeof defaultStorage[key] === "object") {
				if (defaultStorage[key] instanceof DefaultSetting) {
					let useCurrent = true;

					if (defaultStorage[key].type === "array") {
						if (!Array.isArray(oldStorage[key])) {
							useDefault();
							useCurrent = false;
						}
					} else if (
						!defaultStorage[key].type.split("|").some((value) => value === typeof oldStorage[key] || (value === "empty" && oldStorage[key] === ""))
					) {
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

	function convertSpecific(storage, newStorage) {
		const version = toNumericVersion(storedVersion);

		let updated = false;
		if (version <= toNumericVersion("5")) {
			if (storage?.notes?.text || storage?.notes?.height) {
				newStorage.notes.sidebar.text = storage.notes.text || "";
				newStorage.notes.sidebar.height = storage.notes.height || "22px";
			}
			if (storage?.profile_notes?.profiles) {
				for (const [id, { height, notes }] of Object.entries(storage.profile_notes.profiles)) {
					newStorage.notes.profile[id] = { height: height || "17px", text: notes };
				}
			}
			newStorage.quick.items = storage?.quick?.items?.map((id) => ({ id: parseInt(id) })) || [];
			if (storage?.stakeouts)
				newStorage.stakeouts = Object.entries(storage.stakeouts)
					.filter(([id]) => !isNaN(id) && !!parseInt(id))
					.map(([id, stakeout]) => ({
						[id]: {
							alerts: {
								okay: stakeout.notifications.okay,
								hospital: stakeout.notifications.hospital,
								landing: stakeout.notifications.lands,
								online: stakeout.notifications.online,
								life: false,
								offline: false,
							},
						},
					}))
					.filter((result) => Object.values(result)[0] !== undefined)
					.reduce((prev, current) => ({ ...prev, ...current }), {});
			if (storage?.stock_alerts)
				newStorage.settings.notifications.types.stocks = Object.entries(storage.stock_alerts)
					.filter(([id]) => !isNaN(id) && !!parseInt(id))
					.map(([id, alert]) => ({
						[id]: {
							priceFalls: parseInt(alert.fall) || "",
							priceReaches: parseInt(alert.reach) || "",
						},
					}))
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
				return {
					...previousValue,
					[id]: {
						...data,
						respect: data.respect.filter((r) => !!r),
						respect_base: data.respect_base.filter((r) => !!r),
					},
				};
			}, {});

			updated = true;
		} else if (version <= toNumericVersion("7.8.2")) {
			// Reset cache.
			newStorage.cache = {};
			newStorage.userdata = {
				...storage.userdata,
				date: 0,
				dateBasic: 0,
				profile: {
					...storage.userdata,
					id: storage.userdata.player_id,
					spouse: {
						days_married: storage.userdata.married.duration,
					},
					job: {
						id: storage.userdata.job.company_id,
					},
					faction: {
						id: storage.userdata.faction_id,
						tag: storage.userdata.faction.faction_tag,
					},
				},
			};
			if (storage?.settings?.apiUsage?.user?.money === false) {
				newStorage.settings.apiUsage.user.money = false;
			}
			if (storage?.settings?.apiUsage?.user?.honors === false) {
				newStorage.settings.apiUsage.user.honors = false;
			}
			newStorage.torndata = {};

			updated = true;
		} else if (version <= toNumericVersion("7.8.4")) {
			newStorage.cache["profile-stats"] = {};

			updated = true;
		} else if (version <= toNumericVersion("7.8.5")) {
			newStorage.settings.apiUsage.user = {
				...storage.settings.apiUsage.user,
				...storage.settings.apiUsage.userV2,
			};
			newStorage.cache.job = {};

			updated = true;
		}

		if (updated) {
			console.log(`Upgraded database from ${storedVersion} to ${loadedVersion}`);
		}

		newStorage.version.current = loadedVersion;

		function replaceProfileBoxStat(stats, oldStat, newStat) {
			const index = stats.indexOf(oldStat);
			if (index === -1) return stats;

			const newStats = stats.filter((stat) => stat !== oldStat);
			newStats.insertAt(index, newStat);

			return newStats;
		}
	}
}

function populateDatabaseVariables(database) {
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
