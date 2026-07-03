import { settings } from "@common/utils/data/database";

export function loadAPIDemo() {
	if (!settings.pages.api.autoDemo) return;

	document.getElementById("documentation")!.style.setProperty("display", "none");
	document.getElementById("demo")!.style.removeProperty("display");
}
