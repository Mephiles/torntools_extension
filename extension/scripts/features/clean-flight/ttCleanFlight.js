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
		null,
	);

	function addCleanFlight() {
		const agency = document.find(".travel-agency-travelling");
		const hiddenBy = JSON.parse(agency.dataset.hiddenBy || "[]");
		hiddenBy.push("clean-flight");
		agency.dataset.hiddenBy = JSON.stringify(hiddenBy);

		document
			.findAll(".travel-agency-travelling .stage, .travel-agency-travelling .stage + hr, .travel-agency-travelling .popup-info")
			.forEach((x) => x.classList.add("tt-hidden"));
	}

	function removeCleanFlight() {
		const agency = document.find(".travel-agency-travelling");
		const hiddenBy = JSON.parse(agency.dataset.hiddenBy || "[]").filter((by) => by !== "clean-flight");

		if (hiddenBy.length) {
			agency.dataset.hiddenBy = JSON.stringify(hiddenBy);
		} else {
			agency.findAll(".popup-info, .stage, .delimiter-999").forEach((element) => element.classList.remove("tt-hidden"));

			delete agency.dataset.hiddenBy;
		}
	}
})();
