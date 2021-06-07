"use strict";

(async () => {
	featureManager.registerFeature(
		"Hide Areas",
		"sidebar",
		() => settings.hideAreas.length,
		null,
		applyStyle,
		applyStyle,
		{
			storage: ["settings.hideAreas"],
		},
		null
	);

	function applyStyle() {
		for (const area of ALL_AREAS.map((area) => area.class)) {
			document.documentElement.style.setProperty(`--torntools-hide-area-${area}`, settings.hideAreas.includes(area) ? "none" : "initial");
		}
	}
})();
