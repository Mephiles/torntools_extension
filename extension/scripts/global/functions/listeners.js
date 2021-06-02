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
	FACTION_ARMORY_TAB: "faction-armory-tab",
	ITEM_AMOUNT: "item-amount",
	ITEM_EQUIPPED: "item-equipped",
	ITEM_ITEMS_LOADED: "item-items-loaded",
	ITEM_SWITCH_TAB: "item-switch-tab",
	HOSPITAL_SWITCH_PAGE: "hospital-switch-page",
	JAIL_SWITCH_PAGE: "jail-switch-page",
	TRAVEL_SELECT_TYPE: "travel-select-type",
	FEATURE_ENABLED: "feature-enabled",
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

	document.find("head").appendChild(
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

	document.find("head").appendChild(
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
