"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"Clean Flight",
		"travel",
		() => settings.pages.travel.cleanFlight,
		null,
		addCleanFlight,
		removeCleanFlight,
		{
			storage: ["settings.pages.travel.cleanFlight"],
		},
		null,
	);

	function addCleanFlight() {
		document.documentElement.style.setProperty("--torntools-clean-flight-display", "none");
	}

	function removeCleanFlight() {
		document.documentElement.style.setProperty("--torntools-clean-flight-display", "block");
	}
})();
