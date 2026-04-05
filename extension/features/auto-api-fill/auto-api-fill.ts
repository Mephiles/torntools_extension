import { hasAPIData } from "@/utils/common/functions/api";
import { api, settings } from "@/utils/common/data/database";
import { executeScript } from "@/utils/common/functions/dom";

export function loadAutoAPIFill() {
	if (!hasAPIData()) return;
	if (!settings.pages.api.autoFillKey) return;

	const input = document.querySelector<HTMLInputElement>("#api_key");
	if (input.value) return;

	input.value = api.torn.key;
	executeScript(browser.runtime.getURL("/api-key-focus--inject.js"));
}
