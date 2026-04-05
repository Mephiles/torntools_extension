import { settings } from "@/utils/common/data/database";
import { findAllElements } from "@/utils/common/functions/dom";

export function loadAPIPretty() {
	if (!settings.pages.api.autoPretty) return;

	findAllElements<HTMLInputElement>("input[value=pretty]").forEach(p => p.checked = true)
}
