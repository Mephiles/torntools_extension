import { api, settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { executeScript } from "@common/utils/functions/dom";

export function loadAutoAPIFill() {
	if (!hasAPIData()) return;
	if (!settings.pages.api.autoFillKey) return;

	const input = document.querySelector<HTMLInputElement>("#api_key");
	if (input.value) return;

	input.value = api.torn.key;
	executeScript(browser.runtime.getURL("/api-key-focus--inject.js"));
}
