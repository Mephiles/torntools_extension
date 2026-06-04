import { settings } from "@common/utils/data/database";
import { findAllElements } from "@common/utils/functions/dom";

export function loadAPIPretty() {
	if (!settings.pages.api.autoPretty) return;

	findAllElements<HTMLInputElement>("input[value=pretty]").forEach((p) => (p.checked = true));
}
