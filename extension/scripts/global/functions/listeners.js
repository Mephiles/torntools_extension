"use strict";

const EVENT_CHANNELS = {
	FETCH: "tt-fetch",
	XHR: "tt-xhr",
	ITEM_AMOUNT: "tt-item-amount",
	ITEM_SWITCH_TAB: "tt-item-switch-tab",
	ITEM_ITEMS_LOADED: "tt-item-items-loaded",
	CHAT_NEW: "tt-chat-box",
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
