"use strict";

const EVENT_CHANNELS = {
	// Using events on the window.
	FETCH: "tt-fetch",
	XHR: "tt-xhr",
	// Callbacks
	CHAT_MESSAGE: "chat-message",
	CHAT_NEW: "chat-box-new",
	CHAT_OPENED: "chat-box-opened",
	CHAT_PEOPLE_MENU_OPENED: "chat-people-menu-opened",
	CHAT_SETTINGS_MENU_OPENED: "chat-settings-menu-opened",
	CHAT_REFRESHED: "chat-refreshed",
	CHAT_CLOSED: "chat-closed",
	COMPANY_EMPLOYEES_PAGE: "company-employees-page",
	COMPANY_STOCK_PAGE: "company-stock-page",
	FACTION_ARMORY_TAB: "faction-armory-tab",
	FACTION_CRIMES: "faction-crimes",
	FACTION_GIVE_TO_USER: "faction-give-to-user",
	FACTION_UPGRADE_INFO: "faction-upgrade-info",
	FACTION_INFO: "faction-info",
	FACTION_MAIN: "faction-main",
	FACTION_NATIVE_FILTER: "faction-filter_native",
	FACTION_NATIVE_SORT: "faction-sort_native",
	FACTION_NATIVE_ICON_UPDATE: "faction-icon_update_native",
	ITEM_AMOUNT: "item-amount",
	ITEM_EQUIPPED: "item-equipped",
	ITEM_ITEMS_LOADED: "item-items-loaded",
	ITEM_SWITCH_TAB: "item-switch-tab",
	HOSPITAL_SWITCH_PAGE: "hospital-switch-page",
	JAIL_SWITCH_PAGE: "jail-switch-page",
	USERLIST_SWITCH_PAGE: "userlist-switch-page",
	TRAVEL_SELECT_TYPE: "travel-select-type",
	TRAVEL_SELECT_COUNTRY: "travel-select-country",
	FEATURE_ENABLED: "feature-enabled",
	FEATURE_DISABLED: "feature-disabled",
	STATE_CHANGED: "state-changed",
	GYM_LOAD: "gym-load",
	GYM_TRAIN: "gym-train",
	CRIMES_LOADED: "crimes-loaded",
	CRIMES_CRIME: "crimes-crime",
	MISSION_LOAD: "mission-load",
	MISSION_REWARDS: "mission-rewards",
	TRADE: "trade",
	PROFILE_FETCHED: "profile-fetched",
	FILTER_APPLIED: "filter-applied",
	STATS_ESTIMATED: "stats-estimated",
	SWITCH_PAGE: "switch-page",
	AUCTION_SWITCH_TYPE: "auction-switch-type",
	ITEMMARKET_CATEGORY_ITEMS: "itemmarket-category-items",
	ITEMMARKET_ITEMS: "itemmarket-items",
	ITEMMARKET_ITEMS_UPDATE: "itemmarket-items-update",
};

const CUSTOM_LISTENERS = (() => {
	const listeners = {};
	for (const key in EVENT_CHANNELS) {
		listeners[EVENT_CHANNELS[key]] = [];
	}
	return listeners;
})();

let injectedXHR, injectedFetch;

function injectFetch() {
	if (injectedFetch) return;

	executeScript(chrome.runtime.getURL("/scripts/global/inject/fetch.inject.js"), false);
	injectedFetch = true;
}

function addFetchListener(callback) {
	injectFetch();

	window.addEventListener(EVENT_CHANNELS.FETCH, callback);
}

function injectXHR() {
	if (injectedXHR) return;

	executeScript(chrome.runtime.getURL("/scripts/global/inject/xhr.inject.js"), false);
	injectedXHR = true;
}

function addXHRListener(callback) {
	injectXHR();

	window.addEventListener("tt-xhr", callback);
}

function triggerCustomListener(channel, details) {
	for (const listener of CUSTOM_LISTENERS[channel]) {
		listener(details);
	}
}
