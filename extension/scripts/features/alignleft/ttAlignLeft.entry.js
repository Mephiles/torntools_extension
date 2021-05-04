"use strict";

(async () => {
	featureManager.registerFeature(
		"Align Left",
		"global",
		() => settings.pages.global.alignLeft,
		null,
		() => document.body.classList.add("tt-align-left"),
		() => document.body.classList.remove("tt-align-left"),
		{
			storage: ["settings.pages.global.alignLeft"],
		},
		null
	);
})();
