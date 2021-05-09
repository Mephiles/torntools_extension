"use strict";

(async () => {
	await loadDatabase();

	if (!settings.pages.api.autoFillKey) return;

	const input = document.find("input#api_key");
	if (input.value) return;

	input.value = api.torn.key;
	input.focus();
})();
