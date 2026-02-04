(async () => {
	await loadDatabase();

	if (!settings.pages.api.autoDemo) return;

	document.querySelector<HTMLElement>("#documentation").style.setProperty("display", "none");
	document.querySelector<HTMLElement>("#demo").style.removeProperty("display");
})();
