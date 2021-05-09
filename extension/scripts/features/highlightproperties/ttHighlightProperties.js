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
			if (await checkMobile()) return "Not supported on mobile!";
		}
	);

	async function addHighlight() {
		await requireSidebar();
		if (Math.abs(userdata.networth.unpaidfees) >= settings.pages.sidebar.upkeepPropHighlight) document.find("#nav-properties").classList.add("tt-upkeep");
	}

	function removeHighlight() {
		document.findAll(".tt-upkeep").forEach((x) => x.classList.remove("tt-upkeep"));
	}
})();
