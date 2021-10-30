"use strict";

(async () => {
	await requireElement("body");
	if (isFlying() || isAbroad()) return;

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
		document.documentElement.classList.add("tt-hidden-areas");
		for (const area of ALL_AREAS.map((area) => area.class)) {
			document.documentElement.style.setProperty(`--torntools-hide-area-${area}`, settings.hideAreas.includes(area) ? "none" : "initial");
		}
	}
})();
