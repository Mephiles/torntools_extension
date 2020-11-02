console.log("TT - Loading global database.");

let DB;

function requireDatabase(requireEntry = true) {
	return new Promise((resolve, reject) => {
		let checker = setInterval(function () {
			switch (database_status) {
				case DATABASE_STATUSES.ENTRY:
					resolve(true);
					return clearInterval(checker);
				case DATABASE_STATUSES.LOADED:
					if (!requireEntry) {
						resolve(true);
						return clearInterval(checker);
					}
					break;
				case DATABASE_STATUSES.FAILED:
					reject();
					return clearInterval(checker);
			}
		});
	});
}

// Pre-load database
let userdata,
	torndata,
	settings,
	api_key,
	proxy_key,
	chat_highlight,
	itemlist,
	travel_market,
	oc,
	allies,
	loot_times,
	target_list,
	vault,
	personalized,
	mass_messages,
	custom_links,
	loot_alerts,
	extensions,
	new_version,
	hide_icons,
	quick,
	notes,
	profile_notes,
	stakeouts,
	updated,
	networth,
	filters,
	cache,
	watchlist,
	api_history,
	api,
	sorting,
	stock_alerts,
	hide_areas,
	travel_items,
	notifications_custom,
	yata;

(async function () {
	database_status = DATABASE_STATUSES.LOADING;

	ttStorage.get(null, async (db) => {
		DB = db;

		userdata = DB.userdata;
		torndata = DB.torndata;
		settings = DB.settings;
		api_key = DB.api_key;
		proxy_key = DB.proxy_key;
		chat_highlight = DB.chat_highlight;
		itemlist = DB.itemlist;
		travel_market = DB.travel_market;
		oc = DB.oc;
		allies = DB.allies;
		loot_times = DB.loot_times;
		target_list = DB.target_list;
		vault = DB.vault;
		personalized = DB.personalized;
		mass_messages = DB.mass_messages;
		custom_links = DB.custom_links;
		loot_alerts = DB.loot_alerts;
		extensions = DB.extensions;
		new_version = DB.new_version;
		hide_icons = DB.hide_icons;
		quick = DB.quick;
		notes = DB.notes;
		profile_notes = DB.profile_notes;
		stakeouts = DB.stakeouts;
		updated = DB.updated;
		networth = DB.networth;
		filters = DB.filters;
		cache = DB.cache;
		watchlist = DB.watchlist;
		api_history = DB.api_history;
		api = DB.api;
		sorting = DB.sorting;
		stock_alerts = DB.stock_alerts;
		hide_areas = DB.hide_areas;
		travel_items = DB.travel_items;
		notifications_custom = DB.notifications_custom;
		yata = DB.yata;

		if (!api_key) {
			database_status = DATABASE_STATUSES.FAILED;
			console.log("App has not been initialized");
			return;
		}

		if (database_status === DATABASE_STATUSES.LOADING_ENTRY) {
			database_status = DATABASE_STATUSES.ENTRY;
		} else {
			database_status = DATABASE_STATUSES.LOADED;
		}
	});
})();

// noinspection JSDeprecatedSymbols
chrome.storage.onChanged.addListener((changes, area) => {
	if (area !== "local") return;

	if (changes.filters) {
		filters = changes.filters.newValue;
	} else if (changes.userdata) {
		userdata = changes.userdata.newValue;
	}
});
