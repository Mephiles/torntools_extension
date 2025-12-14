"use strict";

(async () => {
	featureManager.registerFeature(
		"Align Left",
		"global",
		() => settings.pages.global.alignLeft,
		null,
		() => document.title != "Torn - Just a moment..." && document.documentElement.classList.add("tt-align-left"),
		() => document.documentElement.classList.remove("tt-align-left"),
		{
			storage: ["settings.pages.global.alignLeft"],
		},
		null
	);
})();
