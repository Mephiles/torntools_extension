"use strict";

(async () => {
	featureManager.registerFeature(
		"Highlight Energy Refill",
		"global",
		() => settings.pages.sidebar.highlightEnergy,
		null,
		applyStyle,
		applyStyle,
		{
			storage: ["settings.pages.sidebar.highlightEnergy", "settings.apiUsage.user.refills", "userdata.refills.energy_refill_used"],
		},
		() => hasAPIData() && settings.apiUsage.user.refills
	);

	function applyStyle() {
		document.documentElement.style.setProperty(
			"--torntools-highlight-energy",
			!userdata.refills.energy_refill_used && settings.pages.sidebar.highlightEnergy ? `#6e8820` : "#333"
		);
	}
})();
