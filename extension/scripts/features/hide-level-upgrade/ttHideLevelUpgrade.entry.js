"use strict";

(async () => {
	featureManager.registerFeature(
		"Hide Level Upgrade",
		"global",
		() => settings.pages.global.hideLevelUpgrade,
		null,
		applyStyle,
		applyStyle,
		{
			storage: ["settings.pages.global.hideLevelUpgrade"],
		},
		null
	);

	function applyStyle() {
		document.documentElement.style.setProperty("--torntools-hide-upgrade-button", settings.pages.global.hideLevelUpgrade ? "none" : "block");
	}
})();
