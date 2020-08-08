console.log("TT - Loading global database.")

let DB;

const DATABASE_STATUSES = {
    "NOT_INITIALIZED": 0,
    "LOADING": 1,
    "LOADED": 2,
    "ENTRY": 3,
    "FAILED": 99,
}

let database_status = DATABASE_STATUSES.NOT_INITIALIZED;

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

function DBfailed() {
    return new Promise((resolve) => {
        requireDatabase(false)
            .then(() => resolve(false))
            .catch(() => resolve(true))
    });
}

// Pre-load database
let userdata, torndata, settings, api_key, chat_highlight, itemlist,
    travel_market, oc, allies, loot_times, target_list, vault, personalized,
    mass_messages, custom_links, loot_alerts, extensions, new_version, hide_icons,
    quick, notes, stakeouts, updated, networth, filters, cache, watchlist, api_history,
    api, sorting, stock_alerts, hide_areas;

(async function () {
    database_status = DATABASE_STATUSES.LOADING;

    ttStorage.get(null, async (db) => {
        DB = db;

        userdata = DB.userdata;
        torndata = DB.torndata;
        settings = DB.settings;
        api_key = DB.api_key;
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

        if (!api_key) {
            app_initialized = false;
            database_status = DATABASE_STATUSES.FAILED;
            console.log("App has not been initialized");
            return;
        }

        database_status = DATABASE_STATUSES.LOADED;
    });
})();