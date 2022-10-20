"use strict";

(async () => {
	if (!getPageStatus().access) return;

	/* Feature is supported on mobile.
	const devices = await checkDevice();
	if (devices.mobile || devices.tablet) return "Not supported on mobiles or tablets!";
	*/

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
		}
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
