"use strict";

(async () => {
	featureManager.registerFeature(
		"Hide Icons",
		"global",
		() => settings.hideIcons.length,
		null,
		applyStyle,
		applyStyle,
		{
			storage: ["settings.hideIcons"],
		},
		null
	);

	function applyStyle() {
		for (let icon of ALL_ICONS) {
			document.documentElement.style.setProperty(`--torntools-hide-icons-${icon}`, settings.hideIcons.includes(icon) ? "none" : "initial");
		}
	}
})();
