"use strict";

(async () => {
	const devices = await checkDevice();
    if (devices.mobile || devices.tablet) return;

	featureManager.registerFeature(
		"Compact Item Market",
		"item market",
		() => settings.pages.itemmarket.compactList,
		null,
		makeCompact,
		restore,
		{
			storage: ["settings.pages.itemmarket.compactList"],
		},
		null
	);

	async function makeCompact() {
		const tabs = await requireElement(".market-tabs");

		tabs.classList.add("tt-compact");
	}

	function restore() {
		document.find(".tt-compact")?.classList.remove("tt-compact");
	}
})();
