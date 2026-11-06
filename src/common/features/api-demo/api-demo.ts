import { settings } from "@common/utils/data/database";

export function loadAPIDemo() {
	if (!settings.pages.api.autoDemo || location.hash) return;

	location.hash = "#demo";
}
