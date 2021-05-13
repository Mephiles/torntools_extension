"use strict";

(async () => {
	if (!isFlying()) return;

	featureManager.registerFeature(
		"Clean Flight",
		"travel",
		() => settings.pages.travel.cleanFlight,
		null,
		addCleanFlight,
		removeCleanFlight,
		{
			storage: ["settings.pages.travel.cleanFlight"],
		},
		null
	);

	function addCleanFlight() {
		document
			.findAll(".travel-agency-travelling .stage, .travel-agency-travelling .stage + hr, .travel-agency-travelling .popup-info")
			.forEach((x) => x.classList.add("hidden"));
	}

	function removeCleanFlight() {
		document
			.findAll(".travel-agency-travelling .stage, .travel-agency-travelling .stage + hr, .travel-agency-travelling .popup-info")
			.forEach((x) => x.classList.remove("hidden"));
	}
})();
