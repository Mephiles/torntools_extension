"use strict";

(async () => {
	if (!getPageStatus().access) return;

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

	async function addCleanFlight() {
		document.querySelector("#travel-root")?.classList.add("tt-clean-flight");
	}

	function removeCleanFlight() {
		document.querySelector(".tt-clean-flight")?.classList.remove("tt-clean-flight");
	}
})();
