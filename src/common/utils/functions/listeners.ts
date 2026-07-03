import { SCRIPT_INJECTOR } from "@common/utils/context";
import { executeScript } from "@common/utils/functions/dom";
import type { FetchDetails, XHRDetails } from "@common/utils/functions/script-injector";

export const EVENT_CHANNEL_FETCH = "tt-fetch";
export const EVENT_CHANNEL_XHR = "tt-xhr";

let injectedXHR: boolean, injectedFetch: boolean;

export function injectFetch() {
	if (injectedFetch) return;

	executeScript(browser.runtime.getURL("/fetch--inject.js"), false);
	injectedFetch = true;
}

type CustomEventInitWithRequiredDetail<T> = EventInit & { detail: T };

function hasEventDetail<T>(event: CustomEventInit<T>): event is CustomEventInitWithRequiredDetail<T> {
	return typeof event.detail !== "undefined";
}

export function addFetchListener(callback: (event: CustomEventInitWithRequiredDetail<FetchDetails>) => void) {
	SCRIPT_INJECTOR.injectFetch();

	window.addEventListener(EVENT_CHANNEL_FETCH, (event: CustomEventInit<FetchDetails>) => {
		if (!hasEventDetail(event)) return;

		callback(event);
	});
}

export function injectXHR() {
	if (injectedXHR) return;

	executeScript(browser.runtime.getURL("/xhr--inject.js"), false);
	injectedXHR = true;
}

export function addXHRListener(callback: (event: CustomEventInitWithRequiredDetail<XHRDetails>) => void) {
	SCRIPT_INJECTOR.injectXHR();

	window.addEventListener(EVENT_CHANNEL_XHR, (event: CustomEventInit<XHRDetails>) => {
		if (!hasEventDetail(event)) return;

		callback(event);
	});
}
