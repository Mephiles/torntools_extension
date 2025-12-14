(async () => {
	if (!isAbroad()) return;
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Abroad Energy Warning",
		"travel",
		() => settings.pages.travel.energyWarning,
		undefined,
		null,
		null,
		{
			storage: ["settings.pages.travel.energyWarning"],
		},
		() => "Disabled until further notice."
	);
})();
