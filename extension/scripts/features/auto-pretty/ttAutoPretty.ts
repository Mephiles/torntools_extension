(async () => {
	await loadDatabase();

	if (!settings.pages.api.autoPretty) return;

	for (const prettyButton of document.findAll<HTMLInputElement>("input[value=pretty]")) {
		prettyButton.checked = true;
	}
})();
