"use strict";

(async () => {
	const devices = await checkDevice();
	if (devices.mobile || devices.tablet) return "Not needed on touch devices.";

	featureManager.registerFeature(
		"Align Left",
		"global",
		() => settings.pages.global.alignLeft,
		null,
		() => document.documentElement.classList.add("tt-align-left"),
		() => document.documentElement.classList.remove("tt-align-left"),
		{
			storage: ["settings.pages.global.alignLeft"],
		},
		null
	);
})();
