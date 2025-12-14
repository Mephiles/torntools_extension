(async () => {
	if (!getPageStatus().access) return;
	if (!isAbroad()) return;

	featureManager.registerFeature(
		"Travel Fill Max",
		"travel",
		() => settings.pages.travel.fillMax,
		null,
		null,
		null,
		null,
		() => "Disabled until further notice."
	);
})();
