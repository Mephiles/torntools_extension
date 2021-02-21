"use strict";

(async () => {
	featureManager.registerFeature(
		"Hide Areas",
		"global",
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
		for (let area of ALL_AREAS.map((area) => area.class)) {
			document.documentElement.style.setProperty(`--torntools-hide-area-${area}`, settings.hideAreas.includes(area) ? "none" : "initial");
		}
	}
})();
