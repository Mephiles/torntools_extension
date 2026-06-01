import { api, settings } from "@utils/data/database";
import { hasAPIData } from "@utils/functions/api";
import { executeScript } from "@utils/functions/dom";
import { browser } from "wxt/browser";

export function loadAutoAPIFill() {
	if (!hasAPIData()) return;
	if (!settings.pages.api.autoFillKey) return;

	const input = document.querySelector<HTMLInputElement>("#api_key");
	if (input.value) return;

	input.value = api.torn.key;
	executeScript(browser.runtime.getURL("/api-key-focus--inject.js"));
}
