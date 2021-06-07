"use strict";

(async () => {
	await loadDatabase();

	if (!settings.pages.api.autoPretty) return;

	for (const prettyButton of document.findAll("input[value=pretty]")) {
		prettyButton.checked = true;
	}
})();
