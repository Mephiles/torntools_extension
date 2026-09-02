import { settings } from "@common/utils/data/database";
import { findElement } from "@common/utils/functions/find-elements.ts";

export function loadAPIDemo() {
	if (!settings.pages.api.autoDemo) return;

	findElement("#documentation").style.setProperty("display", "none");
	findElement("#demo").style.removeProperty("display");
}
