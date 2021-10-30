"use strict";

(async () => {
	await requireElement("body");
	if (isFlying() || isAbroad()) return;

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
