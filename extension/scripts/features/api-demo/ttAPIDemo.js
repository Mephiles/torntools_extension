"use strict";

(async () => {
	await loadDatabase();

	if (!settings.pages.api.autoDemo) return;

	document.find("#documentation").style.setProperty("display", "none");
	document.find("#demo").style.removeProperty("display");
})();
