(async () => {
	await loadDatabase();

	if (!settings.pages.api.autoPretty) return;

	for (const prettyButton of findAllElements<HTMLInputElement>("input[value=pretty]")) {
		prettyButton.checked = true;
	}
})();
