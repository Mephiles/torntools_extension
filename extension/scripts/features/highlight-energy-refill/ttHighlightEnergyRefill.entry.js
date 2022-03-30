"use strict";

(async () => {
	await requireElement("body");

	featureManager.registerFeature(
		"Highlight Energy Refill",
		"sidebar",
		() => settings.pages.sidebar.highlightEnergy,
		null,
		applyStyle,
		applyStyle,
		{
			storage: ["settings.pages.sidebar.highlightEnergy", "userdata.refills.energy_refill_used"],
		},
		() => {
			if (!hasAPIData() || !settings.apiUsage.user.refills) return "No API access.";
		}
	);

	function applyStyle() {
		if (!userdata.refills.energy_refill_used && settings.pages.sidebar.highlightEnergy)
			document.documentElement.classList.add("tt-highlight-energy-refill");
		else document.documentElement.classList.remove("tt-highlight-energy-refill");
	}
})();
