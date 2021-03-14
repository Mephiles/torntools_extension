"use strict";

const EVENT_CHANNELS = {
	FETCH: "tt-fetch",
	XHR: "tt-xhr",
	ITEM_AMOUNT: "tt-item-amount",
	ITEM_SWITCH_TAB: "tt-item-switch-tab",
	ITEM_ITEMS_LOADED: "tt-item-items-loaded",
	ITEM_EQUIPPED: "tt-item-equipped",
	CHAT_NEW: "tt-chat-box-new",
	CHAT_OPENED: "tt-chat-box-opened",
	CHAT_MESSAGE: "tt-chat-message",
	// new channels
	FACTION_ARMORY_TAB: "faction-armory-tab",
};

const CUSTOM_LISTENERS = {
	[EVENT_CHANNELS.FACTION_ARMORY_TAB]: [],
	[EVENT_CHANNELS.ITEM_SWITCH_TAB]: [],
	[EVENT_CHANNELS.ITEM_ITEMS_LOADED]: [],
};

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
	console.log("DKK triggerCustomListener", channel, details);
	for (const listener of CUSTOM_LISTENERS[channel]) {
		listener(details);
	}
}

function registerCustomListener(channel, callback) {
	CUSTOM_LISTENERS[channel].push(callback);
}
