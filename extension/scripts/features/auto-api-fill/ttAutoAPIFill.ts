(async () => {
	await loadDatabase();

	if (!hasAPIData()) return;
	if (!settings.pages.api.autoFillKey) return;

	const input = document.querySelector<HTMLInputElement>("input#api_key");
	if (input.value) return;

	input.value = api.torn.key;
	input.focus();
})();
