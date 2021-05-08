"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"Highlight Property",
		"sidebar",
		() => settings.pages.sidebar.upkeepPropHighlight,
		null,
		addHighlight,
		removeHighlight,
		{
			storage: ["settings.pages.sidebar.upkeepPropHighlight"],
		},
		async () => {
			if (!hasAPIData()) return "No API access.";
			await requireSidebar();
		}
	);

	function addHighlight() {
		if (Math.abs(userdata.networth.unpaidfees) >= settings.pages.sidebar.upkeepPropHighlight) document.find("#nav-properties").classList.add("tt-upkeep");
	}

	function removeHighlight() {
		document.findAll(".tt-upkeep").forEach((x) => x.classList.remove("tt-upkeep"));
	}
})();
