"use strict";

(async () => {
	await loadDatabase();

	if (!settings.pages.api.autoFillKey) return;

	requireElement("input#api_key").then(() => {
		const input = document.find("input#api_key");
		if (input.value) return;

		input.value = api.torn.key;
		input.focus();
	});
})();
