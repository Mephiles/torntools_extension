"use strict";

(async () => {
	if (!getPageStatus().access) return;
	if (isFlying() || isAbroad()) return;

	featureManager.registerFeature(
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
			if (!hasAPIData() || !settings.apiUsage.user.networth) return "No API access.";
		},
	);

	async function addHighlight() {
		await requireSidebar();

		if (Math.abs(userdata.networth.unpaidfees) >= settings.pages.sidebar.upkeepPropHighlight) {
			const navProperties = document.find("#nav-properties");

			if (!navProperties) return;

			navProperties.classList.add("tt-upkeep");
		}
	}

	function removeHighlight() {
		document.findAll(".tt-upkeep").forEach((x) => x.classList.remove("tt-upkeep"));
	}
})();
