"use strict";

const EVENT_CHANNELS = {
	// Using events on the window.
	FETCH: "tt-fetch",
	XHR: "tt-xhr",
	// Callbacks
	CHAT_MESSAGE: "chat-message",
	CHAT_NEW: "chat-box-new",
	CHAT_OPENED: "chat-box-opened",
	CHAT_ERROR: "chat-box-error",
	CHAT_REPORT_OPENED: "chat-report-opened",
	CHAT_REPORT_CLOSED: "chat-report-closed",
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

	document.head.appendChild(
		document.newElement({
			type: "script",
			attributes: { type: "text/javascript", src: chrome.runtime.getURL("/scripts/global/inject/fetch.inject.js") },
		})
	);
	injectedFetch = true;
}

function addFetchListener(callback) {
	injectFetch();

	window.addEventListener(EVENT_CHANNELS.FETCH, callback);
}

function injectXHR() {
	if (injectedXHR) return;

	document.head.appendChild(
		document.newElement({
			type: "script",
			attributes: { type: "text/javascript", src: chrome.runtime.getURL("/scripts/global/inject/xhr.inject.js") },
		})
	);
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
