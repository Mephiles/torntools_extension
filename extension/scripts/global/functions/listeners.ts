enum EVENT_CHANNELS {
	// Using events on the window.
	FETCH = "tt-fetch",
	XHR = "tt-xhr",
	// Callbacks
	CHAT_MESSAGE = "chat-message",
	CHAT_NEW = "chat-box-new",
	CHAT_OPENED = "chat-box-opened",
	CHAT_PEOPLE_MENU_OPENED = "chat-people-menu-opened",
	CHAT_SETTINGS_MENU_OPENED = "chat-settings-menu-opened",
	CHAT_REFRESHED = "chat-refreshed",
	CHAT_RECONNECTED = "chat-reconnected",
	CHAT_CLOSED = "chat-closed",
	COMPANY_EMPLOYEES_PAGE = "company-employees-page",
	COMPANY_STOCK_PAGE = "company-stock-page",
	FACTION_ARMORY_TAB = "faction-armory-tab",
	FACTION_CRIMES = "faction-crimes",
	FACTION_CRIMES2 = "faction-crimes2",
	FACTION_CRIMES2_TAB = "faction-crimes2-tab",
	FACTION_CRIMES2_REFRESH = "faction-crimes2-refresh",
	FACTION_GIVE_TO_USER = "faction-give-to-user",
	FACTION_UPGRADE_INFO = "faction-upgrade-info",
	FACTION_INFO = "faction-info",
	FACTION_MAIN = "faction-main",
	FACTION_NATIVE_FILTER = "faction-filter_native",
	FACTION_NATIVE_SORT = "faction-sort_native",
	FACTION_NATIVE_ICON_UPDATE = "faction-icon_update_native",
	ITEM_AMOUNT = "item-amount",
	ITEM_EQUIPPED = "item-equipped",
	ITEM_ITEMS_LOADED = "item-items-loaded",
	ITEM_SWITCH_TAB = "item-switch-tab",
	HOSPITAL_SWITCH_PAGE = "hospital-switch-page",
	JAIL_SWITCH_PAGE = "jail-switch-page",
	USERLIST_SWITCH_PAGE = "userlist-switch-page",
	TRAVEL_SELECT_TYPE = "travel-select-type",
	TRAVEL_SELECT_COUNTRY = "travel-select-country",
	TRAVEL_DESTINATION_UPDATE = "travel-destination-update",
	TRAVEL_ABROAD__SHOP_LOAD = "TRAVEL_ABROAD__SHOP_LOAD",
	TRAVEL_ABROAD__SHOP_REFRESH = "TRAVEL_ABROAD__SHOP_REFRESH",
	FEATURE_ENABLED = "feature-enabled",
	FEATURE_DISABLED = "feature-disabled",
	STATE_CHANGED = "state-changed",
	GYM_LOAD = "gym-load",
	GYM_TRAIN = "gym-train",
	CRIMES_LOADED = "crimes-loaded",
	CRIMES_CRIME = "crimes-crime",
	CRIMES2_HOME_LOADED = "crimes2-home-loaded",
	CRIMES2_BURGLARY_LOADED = "crimes2-burglary-loaded",
	CRIMES2_CRIME_LOADED = "crimes2-crime-loaded",
	MISSION_LOAD = "mission-load",
	MISSION_REWARDS = "mission-rewards",
	TRADE = "trade",
	PROFILE_FETCHED = "profile-fetched",
	FILTER_APPLIED = "filter-applied",
	STATS_ESTIMATED = "stats-estimated",
	SWITCH_PAGE = "switch-page",
	AUCTION_SWITCH_TYPE = "auction-switch-type",
	ITEMMARKET_CATEGORY_ITEMS = "itemmarket-category-items",
	ITEMMARKET_CATEGORY_ITEMS_UPDATE = "itemmarket-category-items-update",
	ITEMMARKET_ITEMS = "itemmarket-items",
	ITEMMARKET_ITEMS_UPDATE = "itemmarket-items-update",
	ITEMMARKET_ITEM_DETAILS = "itemmarket-item-details",
}

const CUSTOM_LISTENERS = (() => {
	const listeners: { [event: string]: ((details?: any) => void)[] } = {};

	Object.values(EVENT_CHANNELS).forEach((channel) => (listeners[channel] = []));

	return listeners;
})();

let injectedXHR: boolean, injectedFetch: boolean;

function injectFetch() {
	if (injectedFetch) return;

	executeScript(chrome.runtime.getURL("/scripts/global/inject/fetch.inject.js"), false);
	injectedFetch = true;
}

function addFetchListener(callback: (event: CustomEvent<FetchDetails>) => void) {
	injectFetch();

	window.addEventListener(EVENT_CHANNELS.FETCH, callback as EventListener);
}

function injectXHR() {
	if (injectedXHR) return;

	executeScript(chrome.runtime.getURL("/scripts/global/inject/xhr.inject.js"), false);
	injectedXHR = true;
}

function addXHRListener(callback: (event: CustomEvent<XHRDetails>) => void) {
	injectXHR();

	window.addEventListener(EVENT_CHANNELS.XHR, callback as EventListener);
}

function triggerCustomListener(channel: string, details?: any) {
	for (const listener of CUSTOM_LISTENERS[channel]) {
		listener(details);
	}
}
