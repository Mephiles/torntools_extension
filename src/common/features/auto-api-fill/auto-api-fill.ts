import { api, settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { executeScript } from "@common/utils/functions/dom";
import { findElement } from "@common/utils/functions/find-elements";

export function loadAutoAPIFill() {
	if (!hasAPIData()) return;
	if (!settings.pages.api.autoFillKey) return;

	const input = findElement<HTMLInputElement>("#api_key", true);
	if (!input || input.value) return;

	input.value = api.torn.key!;
	executeScript(browser.runtime.getURL("/api-key-focus--inject.js"));
}
